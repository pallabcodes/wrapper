import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

/**
 * Outbox Pattern - Guaranteed Event Delivery
 * 
 * Problem: When you save data + publish event, they're not atomic.
 *          If Kafka fails after DB commit, event is lost.
 * 
 * Solution: Write event to DB (same transaction as data), 
 *           then relay worker publishes and marks as processed.
 * 
 * Usage:
 *   // In your service
 *   await dataSource.transaction(async (manager) => {
 *     await manager.save(Order, order);
 *     await outboxService.enqueue(manager, 'order.created', order);
 *   });
 */

// ============ Outbox Entity ============

export enum OutboxStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    PROCESSED = 'PROCESSED',
    FAILED = 'FAILED',
}

@Entity('outbox_events')
export class OutboxEvent {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    @Index()
    aggregateType: string;

    @Column()
    aggregateId: string;

    @Column()
    @Index()
    eventType: string;

    @Column('jsonb')
    payload: Record<string, any>;

    @Column({
        type: 'enum',
        enum: OutboxStatus,
        default: OutboxStatus.PENDING,
    })
    @Index()
    status: OutboxStatus;

    @Column({ nullable: true })
    correlationId: string;

    @Column({ default: 0 })
    retryCount: number;

    @Column({ nullable: true })
    errorMessage: string;

    @CreateDateColumn()
    @Index()
    createdAt: Date;

    @Column({ nullable: true })
    processedAt: Date;
}

// ============ Outbox Service ============

/**
 * Outbox Publisher Interface - Used by OutboxRelay
 */
export interface OutboxPublisher {
    publish(topic: string, event: { type: string; payload: any }): Promise<void>;
}

@Injectable()
export class OutboxService {
    private readonly logger = new Logger('OutboxService');

    constructor(
        private readonly dataSource: DataSource,
    ) { }

    /**
     * Enqueue event in same transaction as your data
     */
    async enqueue(
        manager: EntityManager,
        eventType: string,
        payload: Record<string, any>,
        options: {
            aggregateType?: string;
            aggregateId?: string;
            correlationId?: string;
        } = {},
    ): Promise<OutboxEvent> {
        const event = manager.create(OutboxEvent, {
            eventType,
            payload,
            aggregateType: options.aggregateType || 'unknown',
            aggregateId: options.aggregateId || payload.id || 'unknown',
            correlationId: options.correlationId,
            status: OutboxStatus.PENDING,
        });

        return manager.save(OutboxEvent, event);
    }

    /**
     * Convenience method when not in a transaction
     */
    async enqueueWithTransaction(
        eventType: string,
        payload: Record<string, any>,
        dataOperation: (manager: EntityManager) => Promise<any>,
        options: {
            aggregateType?: string;
            aggregateId?: string;
            correlationId?: string;
        } = {},
    ): Promise<any> {
        return this.dataSource.transaction(async (manager) => {
            const result = await dataOperation(manager);
            await this.enqueue(manager, eventType, payload, options);
            return result;
        });
    }
}

// ============ Outbox Relay (Worker) ============

@Injectable()
export class OutboxRelay implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger('OutboxRelay');
    private isRunning = false;
    private pollInterval: ReturnType<typeof setInterval> | null = null;
    private readonly batchSize = 100;
    private readonly pollMs = 1000;
    private readonly maxRetries = 5;

    constructor(
        private readonly dataSource: DataSource,
        private readonly publisher: OutboxPublisher,
    ) { }

    onModuleInit() {
        this.start();
    }

    onModuleDestroy() {
        this.stop();
    }

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.logger.log('Outbox relay started');

        this.pollInterval = setInterval(() => this.processOutbox(), this.pollMs);
    }

    stop() {
        this.isRunning = false;
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
        this.logger.log('Outbox relay stopped');
    }

    private async processOutbox(): Promise<void> {
        if (!this.isRunning) return;

        const repo = this.dataSource.getRepository(OutboxEvent);

        try {
            // Get pending events
            const events = await repo.find({
                where: { status: OutboxStatus.PENDING },
                order: { createdAt: 'ASC' },
                take: this.batchSize,
            });

            if (events.length === 0) return;

            this.logger.debug(`Processing ${events.length} outbox events`);

            for (const event of events) {
                await this.processEvent(event, repo);
            }
        } catch (error) {
            this.logger.error('Outbox processing error:', error.message);
        }
    }

    private async processEvent(
        event: OutboxEvent,
        repo: Repository<OutboxEvent>,
    ): Promise<void> {
        try {
            // Mark as processing (optimistic lock)
            await repo.update(event.id, { status: OutboxStatus.PROCESSING });

            // Publish to Kafka/EventBridge
            await this.publisher.publish(event.eventType, {
                type: event.eventType,
                payload: event.payload,
            });

            // Mark as processed
            await repo.update(event.id, {
                status: OutboxStatus.PROCESSED,
                processedAt: new Date(),
            });

            this.logger.debug(`Published outbox event: ${event.eventType}`);
        } catch (error) {
            const retryCount = event.retryCount + 1;

            if (retryCount >= this.maxRetries) {
                await repo.update(event.id, {
                    status: OutboxStatus.FAILED,
                    retryCount,
                    errorMessage: error.message,
                });
                this.logger.error(`Outbox event failed permanently: ${event.id}`, error.message);
            } else {
                await repo.update(event.id, {
                    status: OutboxStatus.PENDING,
                    retryCount,
                    errorMessage: error.message,
                });
                this.logger.warn(`Outbox event retry ${retryCount}/${this.maxRetries}: ${event.id}`);
            }
        }
    }
}

// ============ Usage Example ============

/**
 * Example: Payment Service with Outbox
 * 
 * @Injectable()
 * export class PaymentService {
 *   constructor(
 *     private readonly dataSource: DataSource,
 *     private readonly outbox: OutboxService,
 *   ) {}
 * 
 *   async createPayment(input: CreatePaymentInput) {
 *     return this.dataSource.transaction(async (manager) => {
 *       // 1. Save payment in DB
 *       const payment = manager.create(PaymentEntity, input);
 *       await manager.save(payment);
 * 
 *       // 2. Enqueue event (SAME transaction!)
 *       await this.outbox.enqueue(manager, 'payment.created', {
 *         paymentId: payment.id,
 *         amount: payment.amount,
 *         userId: payment.userId,
 *       }, {
 *         aggregateType: 'Payment',
 *         aggregateId: payment.id,
 *       });
 * 
 *       return payment;
 *     });
 *   }
 * }
 */

import { Injectable, Logger } from '@nestjs/common';

/**
 * Event Types for FlashMart domain events
 */
export enum EventType {
    // Payment Events
    PAYMENT_CREATED = 'payment.created',
    PAYMENT_CONFIRMED = 'payment.confirmed',
    PAYMENT_FAILED = 'payment.failed',
    PAYMENT_REFUNDED = 'payment.refunded',

    // Order Events
    ORDER_CREATED = 'order.created',
    ORDER_CONFIRMED = 'order.confirmed',
    ORDER_CANCELLED = 'order.cancelled',
    ORDER_SHIPPED = 'order.shipped',
    ORDER_DELIVERED = 'order.delivered',

    // Inventory Events
    INVENTORY_RESERVED = 'inventory.reserved',
    INVENTORY_RELEASED = 'inventory.released',
    INVENTORY_DEPLETED = 'inventory.depleted',

    // User Events
    USER_REGISTERED = 'user.registered',
    USER_VERIFIED = 'user.verified',
}

/**
 * Base Domain Event Interface
 */
export interface BaseDomainEvent<T = any> {
    id: string;
    type: EventType | string;
    aggregateId: string;
    aggregateType: string;
    data: T;
    metadata: {
        correlationId: string;
        service: string;
        version: string;
        timestamp: Date;
    };
    timestamp: Date;
}

/**
 * Payment Created Event
 */
export interface PaymentCreatedEvent extends BaseDomainEvent<{
    userId: string;
    amount: number;
    currency: string;
    orderId?: string;
    stripePaymentIntentId: string;
}> {
    type: EventType.PAYMENT_CREATED;
}

/**
 * Event Publisher Interface
 */
export interface IEventPublisher {
    publish(event: BaseDomainEvent): Promise<void>;
    publishBatch(events: BaseDomainEvent[]): Promise<void>;
}

/**
 * In-Memory Event Publisher (Development)
 * In production: Use Kafka, RabbitMQ, or EventBridge
 */
@Injectable()
export class EventPublisher implements IEventPublisher {
    private readonly logger = new Logger('EventPublisher');
    private readonly handlers: Array<(event: BaseDomainEvent) => Promise<void>> = [];

    async publish(event: BaseDomainEvent): Promise<void> {
        this.logger.log({
            message: 'Publishing event',
            type: event.type,
            aggregateId: event.aggregateId,
            correlationId: event.metadata?.correlationId,
        });

        // In production: Send to Kafka/EventBridge
        // await kafkaProducer.send({ topic: event.type, messages: [{ value: JSON.stringify(event) }] });

        // Notify local handlers
        for (const handler of this.handlers) {
            try {
                await handler(event);
            } catch (error) {
                this.logger.error(`Event handler failed: ${error.message}`);
            }
        }
    }

    async publishBatch(events: BaseDomainEvent[]): Promise<void> {
        for (const event of events) {
            await this.publish(event);
        }
    }

    subscribe(handler: (event: BaseDomainEvent) => Promise<void>): void {
        this.handlers.push(handler);
    }
}

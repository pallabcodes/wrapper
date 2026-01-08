import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { DeadLetterEntity } from '../infrastructure/dead-letter/entities/dead-letter.entity';
import { ConfigService } from '@nestjs/config';
import { ClientKafka } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';

/**
 * DLQ Processor Service
 * 
 * Automatically retries failed messages from the Dead Letter Queue
 * with exponential backoff and failure escalation.
 */
@Injectable()
export class DlqProcessorService {
    private readonly logger = new Logger(DlqProcessorService.name);
    private readonly maxRetries: number;
    private readonly baseDelayMs: number;

    constructor(
        @InjectRepository(DeadLetterEntity)
        private readonly dlqRepository: Repository<DeadLetterEntity>,
        private readonly configService: ConfigService,
        @Inject('KAFKA_CLIENT') private readonly kafkaClient: ClientKafka,
    ) {
        this.maxRetries = this.configService.get('DLQ_MAX_RETRIES', 5);
        this.baseDelayMs = this.configService.get('DLQ_BASE_DELAY_MS', 60000); // 1 minute
    }

    /**
     * Process DLQ every 5 minutes
     */
    @Cron(CronExpression.EVERY_5_MINUTES)
    async processDlq(): Promise<void> {
        this.logger.log('Starting DLQ processing...');

        try {
            // Get messages ready for retry
            const messages = await this.getRetryableMessages();

            this.logger.log(`Found ${messages.length} messages ready for retry`);

            for (const message of messages) {
                await this.processMessage(message);
            }

            this.logger.log('DLQ processing completed');
        } catch (error) {
            this.logger.error('DLQ processing failed', error);
        }
    }

    /**
     * Get messages that are ready for retry based on backoff
     */
    private async getRetryableMessages(): Promise<DeadLetterEntity[]> {
        const now = new Date();

        return this.dlqRepository
            .createQueryBuilder('dlq')
            .where('dlq.status = :status', { status: 'pending' })
            .andWhere('dlq.retryCount < :maxRetries', { maxRetries: this.maxRetries })
            .andWhere('dlq.nextRetryAt <= :now', { now })
            .orderBy('dlq.createdAt', 'ASC')
            .limit(100) // Process in batches
            .getMany();
    }

    /**
     * Process a single DLQ message
     */
    private async processMessage(message: DeadLetterEntity): Promise<void> {
        this.logger.log(`Processing DLQ message ${message.id} (attempt ${message.retryCount + 1})`);

        try {
            // Republish to original topic
            await this.republishMessage(message);

            // Mark as processed
            await this.markAsProcessed(message);

            this.logger.log(`DLQ message ${message.id} republished successfully`);
        } catch (error) {
            this.logger.error(`Failed to process DLQ message ${message.id}`, error);
            await this.handleFailure(message, error);
        }
    }

    /**
     * Republish message to its original topic
     */
    private async republishMessage(message: DeadLetterEntity): Promise<void> {
        const { originalTopic, payload, metadata } = message;

        await this.kafkaClient.emit(originalTopic, {
            key: metadata?.key || message.id,
            value: payload,
            headers: {
                ...metadata?.headers,
                'x-dlq-retry': 'true',
                'x-dlq-retry-count': String(message.retryCount + 1),
                'x-dlq-original-id': message.id,
            },
        });
    }

    /**
     * Mark message as successfully processed
     */
    private async markAsProcessed(message: DeadLetterEntity): Promise<void> {
        await this.dlqRepository.update(message.id, {
            status: 'processed',
            processedAt: new Date(),
            retryCount: message.retryCount + 1,
        });
    }

    /**
     * Handle retry failure with exponential backoff
     */
    private async handleFailure(message: DeadLetterEntity, error: Error): Promise<void> {
        const newRetryCount = message.retryCount + 1;

        if (newRetryCount >= this.maxRetries) {
            // Escalate - mark as failed permanently
            await this.escalateMessage(message, error);
        } else {
            // Calculate next retry time with exponential backoff
            const delayMs = this.baseDelayMs * Math.pow(2, newRetryCount);
            const nextRetryAt = new Date(Date.now() + delayMs);

            await this.dlqRepository.update(message.id, {
                retryCount: newRetryCount,
                lastError: error.message,
                nextRetryAt,
            });

            this.logger.log(
                `DLQ message ${message.id} scheduled for retry at ${nextRetryAt.toISOString()}`,
            );
        }
    }

    /**
     * Escalate permanently failed messages
     */
    private async escalateMessage(message: DeadLetterEntity, error: Error): Promise<void> {
        this.logger.error(
            `DLQ message ${message.id} exceeded max retries, escalating`,
            { error: error.message, originalTopic: message.originalTopic },
        );

        await this.dlqRepository.update(message.id, {
            status: 'failed',
            lastError: `Max retries exceeded: ${error.message}`,
            processedAt: new Date(),
        });

        // TODO: Send alert to PagerDuty/Slack
        // await this.alertService.sendCriticalAlert({
        //   title: 'DLQ Message Permanently Failed',
        //   message: `Message ${message.id} from topic ${message.originalTopic} failed after ${this.maxRetries} retries`,
        //   payload: message.payload,
        // });
    }

    /**
     * Manual retry for specific message
     */
    async retryMessage(messageId: string): Promise<boolean> {
        const message = await this.dlqRepository.findOne({ where: { id: messageId } });

        if (!message) {
            throw new Error(`DLQ message ${messageId} not found`);
        }

        if (message.status === 'processed') {
            throw new Error(`DLQ message ${messageId} already processed`);
        }

        // Reset retry count and process immediately
        message.retryCount = 0;
        message.nextRetryAt = new Date();
        await this.dlqRepository.save(message);

        await this.processMessage(message);
        return true;
    }

    /**
     * Get DLQ statistics
     */
    async getStatistics(): Promise<{
        pending: number;
        processed: number;
        failed: number;
        byTopic: Record<string, number>;
    }> {
        const [pending, processed, failed] = await Promise.all([
            this.dlqRepository.count({ where: { status: 'pending' } }),
            this.dlqRepository.count({ where: { status: 'processed' } }),
            this.dlqRepository.count({ where: { status: 'failed' } }),
        ]);

        const byTopic = await this.dlqRepository
            .createQueryBuilder('dlq')
            .select('dlq.originalTopic', 'topic')
            .addSelect('COUNT(*)', 'count')
            .where('dlq.status = :status', { status: 'pending' })
            .groupBy('dlq.originalTopic')
            .getRawMany();

        return {
            pending,
            processed,
            failed,
            byTopic: byTopic.reduce((acc, { topic, count }) => {
                acc[topic] = parseInt(count, 10);
                return acc;
            }, {}),
        };
    }
}

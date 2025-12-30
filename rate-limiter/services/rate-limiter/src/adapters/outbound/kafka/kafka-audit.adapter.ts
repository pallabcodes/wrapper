import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Kafka, Producer, Partitioners } from 'kafkajs';
import { RateLimitEvent } from '@ratelimiter/common';
import { IAuditService } from '../../../core/ports/audit.port';

@Injectable()
export class KafkaAuditAdapter implements IAuditService, OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(KafkaAuditAdapter.name);
    private kafka: Kafka;
    private producer: Producer;

    constructor() {
        this.kafka = new Kafka({
            clientId: 'rate-limiter-service',
            brokers: ['localhost:9092'], // Redpanda external port
        });

        this.producer = this.kafka.producer({
            createPartitioner: Partitioners.DefaultPartitioner,
        });
    }

    async onModuleInit() {
        try {
            await this.producer.connect();
            this.logger.log('🚀 Connected to Kafka (Redpanda)');
        } catch (error) {
            this.logger.error('❌ Failed to connect to Kafka', error);
        }
    }

    async onModuleDestroy() {
        await this.producer.disconnect();
    }

    async emitGeneric(topic: string, event: RateLimitEvent): Promise<void> {
        try {
            await this.producer.send({
                topic,
                messages: [
                    {
                        key: event.clientId, // Ensure ordering by client
                        value: JSON.stringify(event),
                    },
                ],
            });
            // this.logger.debug(`Sent event to ${topic} for ${event.clientId}`);
        } catch (error) {
            this.logger.error(`Failed to send event to ${topic}`, error);
        }
    }

    async publishAudit(event: RateLimitEvent): Promise<void> {
        await this.emitGeneric('rate-limit.audit', event);
    }
}

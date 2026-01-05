import { Injectable } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import {
    IAuditPublisher,
    RateLimitCheckEvent,
} from '@domain/ports/audit-publisher.port';
import { config } from '../config/app.config';

/**
 * Infrastructure Adapter: Kafka Audit Publisher
 * 
 * Implements IAuditPublisher port
 * (In Hexagonal: adapters/outbound/kafka/kafka-audit.adapter.ts)
 */
@Injectable()
export class KafkaAuditPublisher implements IAuditPublisher {
    private producer: Producer;

    constructor() {
        const kafka = new Kafka({
            clientId: 'rate-limiter-clean',
            brokers: [config.kafka.broker],
        });
        this.producer = kafka.producer();
    }

    async onModuleInit() {
        await this.producer.connect();
    }

    async publish(event: RateLimitCheckEvent): Promise<void> {
        await this.producer.send({
            topic: 'rate-limit-audit',
            messages: [
                {
                    key: event.clientId,
                    value: JSON.stringify(event),
                },
            ],
        });
    }

    async onModuleDestroy() {
        await this.producer.disconnect();
    }
}

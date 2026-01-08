import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { IEventBus, DomainEvent } from '@streamverse/common';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class KafkaEventBusAdapter implements IEventBus, OnModuleInit {
    private readonly logger = new Logger(KafkaEventBusAdapter.name);

    constructor(
        @Inject('KAFKA_CLIENT') private readonly kafkaClient: ClientKafka,
    ) { }

    async onModuleInit() {
        this.kafkaClient.subscribeToResponseOf('payment.created'); // Example topic if needed for Request-Response
        try {
            await this.kafkaClient.connect();
            this.logger.log('Kafka Client connected successfully');
        } catch (error) {
            this.logger.error('Failed to connect to Kafka:', error);
        }
    }

    async publish(event: DomainEvent): Promise<void> {
        const topic = event.getEventName();
        const payload = JSON.stringify(event.toJSON()); // Ensure payload is serialized

        this.logger.log(`Publishing event to topic ${topic}: ${event.aggregateId}`);

        try {
            // emit returns an Observable, we convert to Promise
            await lastValueFrom(this.kafkaClient.emit(topic, payload));
        } catch (error) {
            this.logger.error(`Error publishing event to ${topic}:`, error);
            throw error;
        }
    }

    async publishAll(events: DomainEvent[]): Promise<void> {
        await Promise.all(events.map((event) => this.publish(event)));
    }
}

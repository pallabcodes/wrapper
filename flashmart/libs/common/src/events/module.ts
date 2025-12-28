import { Module, Global } from '@nestjs/common';
import { EventPublisher } from './publisher';

/**
 * Events Module - Provides EventPublisher for dependency injection
 */
@Global()
@Module({
    providers: [EventPublisher],
    exports: [EventPublisher],
})
export class EventsModule { }

/**
 * Kafka Event Bus - Placeholder for Kafka integration
 * In production: Replace with actual Kafka client
 */
export class KafkaEventBus {
    async emit(topic: string, payload: any): Promise<void> {
        console.log(`[Kafka] Emit to ${topic}:`, payload);
        // In production: kafkaProducer.send({ topic, messages: [{ value: JSON.stringify(payload) }] });
    }

    async subscribe(topic: string, handler: (payload: any) => Promise<void>): Promise<void> {
        console.log(`[Kafka] Subscribed to ${topic}`);
        // In production: kafkaConsumer.subscribe({ topic });
    }
}

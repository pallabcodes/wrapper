import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventBus, FlashMartEvent, EventType } from '../event-types';
import { KafkaProducerService } from './kafka-producer.service';
import { KafkaConsumerService } from './kafka-consumer.service';

@Injectable()
export class KafkaEventBus implements EventBus, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('KafkaEventBus');
  private readonly serviceName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly kafkaProducer: KafkaProducerService,
    private readonly kafkaConsumer: KafkaConsumerService,
  ) {
    this.serviceName = configService.get('SERVICE_NAME', 'unknown-service');
  }

  async onModuleInit() {
    await this.kafkaProducer.onModuleInit();
    await this.kafkaConsumer.onModuleInit();
  }

  async onModuleDestroy() {
    await this.kafkaProducer.onModuleDestroy();
    await this.kafkaConsumer.onModuleDestroy();
  }

  async publish(event: FlashMartEvent): Promise<void> {
    try {
      // Convert event type to Kafka topic
      const topic = this.eventTypeToTopic(event.type);

      // Add service metadata
      const enrichedEvent = {
        ...event,
        metadata: {
          ...event.metadata,
          publishedBy: this.serviceName,
          publishedAt: new Date().toISOString(),
        },
      };

      await this.kafkaProducer.emit(topic, enrichedEvent);

      this.logger.debug(`Published event ${event.type} to topic ${topic}`, {
        eventId: event.id,
        correlationId: event.metadata.correlationId,
      });
    } catch (error) {
      this.logger.error(`Failed to publish event ${event.type}:`, error);
      throw error;
    }
  }

  subscribe<T extends FlashMartEvent>(
    eventType: EventType,
    handler: (event: T) => Promise<void>,
  ): void {
    const topic = this.eventTypeToTopic(eventType);

    this.kafkaConsumer.subscribe(topic, async (message) => {
      try {
        const event = JSON.parse(message.value.toString()) as T;

        // Add correlation context
        const correlationId = event.metadata?.correlationId;
        if (correlationId) {
          // Set correlation ID in async local storage or context
          // This would be used by logging and tracing
        }

        await handler(event);

        this.logger.debug(`Processed event ${event.type} from topic ${topic}`, {
          eventId: event.id,
          correlationId: event.metadata?.correlationId,
        });
      } catch (error) {
        this.logger.error(`Error processing event from topic ${topic}:`, error);
        // In production, you might want to send to dead letter queue
      }
    });
  }

  unsubscribe(eventType: EventType, handler: Function): void {
    // Kafka consumers typically don't unsubscribe from individual handlers
    // This is a no-op for Kafka implementation
    this.logger.warn(`Unsubscribe not supported for Kafka event bus`);
  }

  private eventTypeToTopic(eventType: EventType): string {
    // Convert event type to Kafka topic
    // e.g., 'user.created' -> 'flashmart.user.created'
    return `flashmart.${eventType.replace('.', '.')}`;
  }

  private topicToEventType(topic: string): EventType {
    // Convert Kafka topic back to event type
    // e.g., 'flashmart.user.created' -> 'user.created'
    return topic.replace('flashmart.', '').replace('.', '.') as EventType;
  }
}

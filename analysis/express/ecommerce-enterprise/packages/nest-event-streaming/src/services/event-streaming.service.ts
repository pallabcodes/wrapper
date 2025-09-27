import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';
import {
  EventStreamingConfig,
  EventMessage,
  EventHandler,
  EventPublisher,
  EventSubscriber,
  EventStreamingMetrics,
  EventStreamingHealth,
  EventStreamingOptions,
} from '../interfaces/event-streaming.interface';
import { KafkaService } from './kafka.service';
import { RabbitMQService } from './rabbitmq.service';
import { RedisService } from './redis.service';

@Injectable()
export class EventStreamingService implements EventPublisher, EventSubscriber, OnModuleInit {
  private readonly logger = new Logger(EventStreamingService.name);
  private provider!: EventPublisher & EventSubscriber;
  private config: EventStreamingConfig;
  private options: EventStreamingOptions;

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
    @Optional() private kafkaService: KafkaService,
    @Optional() private rabbitmqService: RabbitMQService,
    @Optional() private redisService: RedisService,
  ) {
    this.config = this.configService.get<EventStreamingConfig>('EVENT_STREAMING_CONFIG') || {
      provider: 'kafka',
      kafka: {
        clientId: 'ecommerce-enterprise',
        brokers: ['localhost:9092'],
      },
    };

    this.options = this.configService.get<EventStreamingOptions>('EVENT_STREAMING_OPTIONS') || {
      enableMetrics: true,
      enableHealthChecks: true,
      enableRetry: true,
      enableDeadLetterQueue: true,
      maxRetries: 3,
      retryDelay: 1000,
      batchSize: 100,
      flushInterval: 5000,
      compression: false,
      encryption: false,
    };
  }

  async onModuleInit() {
    await this.initializeProvider();
  }

  private async initializeProvider() {
    switch (this.config.provider) {
      case 'kafka':
        if (!this.kafkaService) {
          throw new Error('KafkaService is not available');
        }
        this.provider = this.kafkaService;
        break;
      case 'rabbitmq':
        if (!this.rabbitmqService) {
          throw new Error('RabbitMQService is not available');
        }
        this.provider = this.rabbitmqService;
        break;
      case 'redis':
        if (!this.redisService) {
          throw new Error('RedisService is not available');
        }
        this.provider = this.redisService;
        break;
      default:
        throw new Error(`Unsupported event streaming provider: ${this.config.provider}`);
    }

    this.logger.log(`Event streaming initialized with provider: ${this.config.provider}`);
  }

  async publish(topic: string, message: EventMessage): Promise<void> {
    try {
      const enrichedMessage = this.enrichMessage(message);
      
      await this.provider.publish(topic, enrichedMessage);
      
      // Emit local event for internal processing
      this.eventEmitter.emit('event.published', {
        topic,
        message: enrichedMessage,
        timestamp: new Date(),
      });

      this.logger.debug(`Event published to topic ${topic}:`, enrichedMessage.id);
    } catch (error) {
      this.logger.error(`Failed to publish event to topic ${topic}:`, error);
      
      // Emit error event
      this.eventEmitter.emit('event.publish.failed', {
        topic,
        message,
        error: (error as Error).message,
        timestamp: new Date(),
      });
      
      throw error;
    }
  }

  async publishBatch(topic: string, messages: EventMessage[]): Promise<void> {
    try {
      const enrichedMessages = messages.map(message => this.enrichMessage(message));
      
      await this.provider.publishBatch(topic, enrichedMessages);
      
      // Emit local event for internal processing
      this.eventEmitter.emit('event.batch.published', {
        topic,
        messageCount: enrichedMessages.length,
        timestamp: new Date(),
      });

      this.logger.debug(`Batch of ${enrichedMessages.length} events published to topic ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to publish batch to topic ${topic}:`, error);
      
      // Emit error event
      this.eventEmitter.emit('event.batch.publish.failed', {
        topic,
        messageCount: messages.length,
        error: (error as Error).message,
        timestamp: new Date(),
      });
      
      throw error;
    }
  }

  async subscribe(topic: string, handler: EventHandler): Promise<void> {
    try {
      const wrappedHandler: EventHandler = {
        ...handler,
        handler: async (message: EventMessage) => {
          try {
            // Emit local event for internal processing
            this.eventEmitter.emit('event.received', {
              topic,
              message,
              timestamp: new Date(),
            });

            await handler.handler(message);

            // Emit success event
            this.eventEmitter.emit('event.processed', {
              topic,
              message,
              timestamp: new Date(),
            });
          } catch (error) {
            this.logger.error(`Error processing event ${message.id}:`, error);
            
            // Emit error event
            this.eventEmitter.emit('event.process.failed', {
              topic,
              message,
              error: (error as Error).message,
              timestamp: new Date(),
            });
            
            throw error;
          }
        },
      };

      await this.provider.subscribe(topic, wrappedHandler);
      this.logger.log(`Subscribed to topic ${topic} for event type ${handler.eventType}`);
    } catch (error) {
      this.logger.error(`Failed to subscribe to topic ${topic}:`, error);
      throw error;
    }
  }

  async unsubscribe(topic: string, eventType: string): Promise<void> {
    try {
      await this.provider.unsubscribe(topic, eventType);
      this.logger.log(`Unsubscribed from topic ${topic} for event type ${eventType}`);
    } catch (error) {
      this.logger.error(`Failed to unsubscribe from topic ${topic}:`, error);
      throw error;
    }
  }

  getSubscriptions(): Map<string, EventHandler[]> {
    return this.provider.getSubscriptions();
  }

  private enrichMessage(message: EventMessage): EventMessage {
    return {
      ...message,
      id: message.id || uuidv4(),
      timestamp: message.timestamp || new Date(),
      metadata: {
        ...message.metadata,
        version: '1.0.0',
        schema: 'ecommerce-event',
        publishedAt: new Date().toISOString(),
      },
    };
  }

  // Event creation helpers
  createEvent(type: string, source: string, data: any, metadata?: any): EventMessage {
    return {
      id: uuidv4(),
      type,
      source,
      timestamp: new Date(),
      data,
      metadata: {
        ...metadata,
        version: '1.0.0',
        schema: 'ecommerce-event',
      },
    };
  }

  // Business event helpers
  createUserEvent(eventType: string, userId: string, data: any): EventMessage {
    return this.createEvent(eventType, 'user-service', data, {
      userId,
      correlationId: uuidv4(),
    });
  }

  createOrderEvent(eventType: string, orderId: string, data: any): EventMessage {
    return this.createEvent(eventType, 'order-service', data, {
      orderId,
      correlationId: uuidv4(),
    });
  }

  createPaymentEvent(eventType: string, paymentId: string, data: any): EventMessage {
    return this.createEvent(eventType, 'payment-service', data, {
      paymentId,
      correlationId: uuidv4(),
    });
  }

  createInventoryEvent(eventType: string, productId: string, data: any): EventMessage {
    return this.createEvent(eventType, 'inventory-service', data, {
      productId,
      correlationId: uuidv4(),
    });
  }

  // Metrics and health
  async getMetrics(): Promise<EventStreamingMetrics> {
    if (this.provider && 'getMetrics' in this.provider) {
      return (this.provider as any).getMetrics();
    }
    
    return {
      totalEvents: 0,
      publishedEvents: 0,
      consumedEvents: 0,
      failedEvents: 0,
      averageLatency: 0,
      throughput: 0,
      errorRate: 0,
      topics: {},
    };
  }

  async getHealth(): Promise<EventStreamingHealth> {
    if (this.provider && 'getHealth' in this.provider) {
      return (this.provider as any).getHealth();
    }
    
    return {
      status: 'unhealthy',
      provider: this.config.provider,
      connected: false,
      lastCheck: new Date(),
      metrics: await this.getMetrics(),
      issues: ['Provider not initialized'],
    };
  }

  // Configuration
  getConfig(): EventStreamingConfig {
    return { ...this.config };
  }

  getOptions(): EventStreamingOptions {
    return { ...this.options };
  }

  // Event filtering and routing
  async publishToMultipleTopics(topics: string[], message: EventMessage): Promise<void> {
    const promises = topics.map(topic => this.publish(topic, message));
    await Promise.all(promises);
  }

  async subscribeToMultipleTopics(topics: string[], handler: EventHandler): Promise<void> {
    const promises = topics.map(topic => this.subscribe(topic, handler));
    await Promise.all(promises);
  }

  // Event replay (for debugging and recovery)
  async replayEvents(_topic: string, _fromTimestamp: Date, _toTimestamp: Date): Promise<EventMessage[]> {
    // This would be implemented based on the specific provider
    // For now, return empty array as a placeholder
    this.logger.warn('Event replay not implemented for current provider');
    return [];
  }

  // Event deduplication
  async publishWithDeduplication(topic: string, message: EventMessage, _ttl: number = 3600): Promise<void> {
    // This would implement deduplication logic
    // For now, just publish normally
    await this.publish(topic, message);
  }
}

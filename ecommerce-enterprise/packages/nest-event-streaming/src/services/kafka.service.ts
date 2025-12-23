import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, Consumer, EachMessagePayload, Message } from 'kafkajs';
// import { v4 as uuidv4 } from 'uuid';
import {
  EventStreamingConfig,
  EventMessage,
  EventHandler,
  EventPublisher,
  EventSubscriber,
  EventStreamingMetrics,
  EventStreamingHealth,
} from '../interfaces/event-streaming.interface';

@Injectable()
export class KafkaService implements EventPublisher, EventSubscriber, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka!: Kafka;
  private producer!: Producer;
  private consumer!: Consumer;
  private config: EventStreamingConfig;
  private handlers: Map<string, EventHandler[]> = new Map();
  private metrics!: EventStreamingMetrics;
  private isConnected = false;

  constructor(private configService: ConfigService) {
    this.config = this.configService.get<EventStreamingConfig>('EVENT_STREAMING_CONFIG') || {
      provider: 'kafka',
      kafka: {
        clientId: 'ecommerce-enterprise',
        brokers: ['localhost:9092'],
        retry: {
          initialRetryTime: 100,
          retries: 8,
        },
      },
    };

    this.initializeMetrics();
  }

  async onModuleInit() {
    await this.initializeKafka();
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private initializeKafka() {
    if (!this.config.kafka) {
      throw new Error('Kafka configuration is required');
    }

    this.kafka = new Kafka({
      clientId: this.config.kafka.clientId,
      brokers: this.config.kafka.brokers,
      ssl: this.config.kafka.ssl || false,
      sasl: this.config.kafka.sasl as any,
      retry: this.config.kafka.retry || { initialRetryTime: 100, retries: 3 },
    });

    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({ groupId: 'ecommerce-enterprise-group' });
  }

  private async connect() {
    try {
      await this.producer.connect();
      await this.consumer.connect();
      this.isConnected = true;
      this.logger.log('Kafka connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to Kafka:', error);
      this.isConnected = false;
      throw error;
    }
  }

  private async disconnect() {
    try {
      await this.producer.disconnect();
      await this.consumer.disconnect();
      this.isConnected = false;
      this.logger.log('Kafka disconnected');
    } catch (error) {
      this.logger.error('Error disconnecting from Kafka:', error);
    }
  }

  async publish(topic: string, message: EventMessage): Promise<void> {
    try {
      const kafkaMessage: Message = {
        key: message.id,
        value: JSON.stringify(message),
        headers: {
          eventType: message.type,
          source: message.source,
          timestamp: message.timestamp.toISOString(),
          ...message.headers,
        },
      };

      await this.producer.send({
        topic,
        messages: [kafkaMessage],
      });

      this.updateMetrics('published');
      this.logger.debug(`Event published to topic ${topic}:`, message.id);
    } catch (error) {
      this.updateMetrics('failed');
      this.logger.error(`Failed to publish event to topic ${topic}:`, error);
      throw error;
    }
  }

  async publishBatch(topic: string, messages: EventMessage[]): Promise<void> {
    try {
      const kafkaMessages: Message[] = messages.map(message => ({
        key: message.id,
        value: JSON.stringify(message),
        headers: {
          eventType: message.type,
          source: message.source,
          timestamp: message.timestamp.toISOString(),
          ...message.headers,
        },
      }));

      await this.producer.send({
        topic,
        messages: kafkaMessages,
      });

      this.updateMetrics('published', messages.length);
      this.logger.debug(`Batch of ${messages.length} events published to topic ${topic}`);
    } catch (error) {
      this.updateMetrics('failed', messages.length);
      this.logger.error(`Failed to publish batch to topic ${topic}:`, error);
      throw error;
    }
  }

  async subscribe(topic: string, handler: EventHandler): Promise<void> {
    try {
      if (!this.handlers.has(topic)) {
        this.handlers.set(topic, []);
      }

      this.handlers.get(topic)!.push(handler);

      await this.consumer.subscribe({ topic, fromBeginning: false });

      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload, topic);
        },
      });

      this.logger.log(`Subscribed to topic ${topic} for event type ${handler.eventType}`);
    } catch (error) {
      this.logger.error(`Failed to subscribe to topic ${topic}:`, error);
      throw error;
    }
  }

  async unsubscribe(topic: string, eventType: string): Promise<void> {
    try {
      const handlers = this.handlers.get(topic);
      if (handlers) {
        const filteredHandlers = handlers.filter(h => h.eventType !== eventType);
        this.handlers.set(topic, filteredHandlers);

        if (filteredHandlers.length === 0) {
          await this.consumer.stop();
          this.handlers.delete(topic);
        }
      }

      this.logger.log(`Unsubscribed from topic ${topic} for event type ${eventType}`);
    } catch (error) {
      this.logger.error(`Failed to unsubscribe from topic ${topic}:`, error);
      throw error;
    }
  }

  getSubscriptions(): Map<string, EventHandler[]> {
    return new Map(this.handlers);
  }

  private async handleMessage(payload: EachMessagePayload, topic: string): Promise<void> {
    try {
      const message = JSON.parse(payload.message.value?.toString() || '{}') as EventMessage;
      const eventType = payload.message.headers?.['eventType']?.toString();

      if (!eventType) {
        this.logger.warn('Received message without event type');
        return;
      }

      const handlers = this.handlers.get(topic) || [];
      const relevantHandlers = handlers.filter(h => h.eventType === eventType);

      for (const handler of relevantHandlers) {
        try {
          await this.executeHandler(handler, message);
        } catch (error) {
          this.logger.error(`Handler failed for event ${eventType}:`, error);
          this.updateMetrics('failed');
        }
      }

      this.updateMetrics('consumed');
    } catch (error) {
      this.logger.error('Error handling message:', error);
      this.updateMetrics('failed');
    }
  }

  private async executeHandler(handler: EventHandler, message: EventMessage): Promise<void> {
    const startTime = Date.now();

    try {
      await handler.handler(message);
      const duration = Date.now() - startTime;
      this.updateLatency(duration);
    } catch (error) {
      if (handler.options?.retry) {
        await this.retryHandler(handler, message, error);
      } else {
        throw error;
      }
    }
  }

  private async retryHandler(handler: EventHandler, message: EventMessage, _error: any): Promise<void> {
    const maxRetries = handler.options?.maxRetries || 3;
    const retryDelay = handler.options?.retryDelay || 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        await handler.handler(message);
        this.logger.log(`Handler succeeded on retry attempt ${attempt}`);
        return;
      } catch (retryError) {
        if (attempt === maxRetries) {
          this.logger.error(`Handler failed after ${maxRetries} retries:`, retryError);
          if (handler.options?.deadLetterQueue) {
            await this.sendToDeadLetterQueue(handler.options.deadLetterQueue, message, retryError);
          }
          throw retryError;
        }
      }
    }
  }

  private async sendToDeadLetterQueue(queue: string, message: EventMessage, error: any): Promise<void> {
    try {
      const deadLetterMessage: EventMessage = {
        ...message,
        metadata: {
          ...message.metadata,
          originalError: error.message,
          deadLetterReason: 'max_retries_exceeded',
        },
      };

      await this.publish(queue, deadLetterMessage);
      this.logger.log(`Message sent to dead letter queue: ${queue}`);
    } catch (dlqError) {
      this.logger.error('Failed to send message to dead letter queue:', dlqError);
    }
  }

  private initializeMetrics(): void {
    this.metrics = {
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

  private updateMetrics(type: 'published' | 'consumed' | 'failed', count = 1): void {
    this.metrics.totalEvents += count;
    
    switch (type) {
      case 'published':
        this.metrics.publishedEvents += count;
        break;
      case 'consumed':
        this.metrics.consumedEvents += count;
        break;
      case 'failed':
        this.metrics.failedEvents += count;
        break;
    }

    this.metrics.errorRate = this.metrics.failedEvents / this.metrics.totalEvents;
    this.metrics.throughput = this.metrics.totalEvents / (Date.now() / 1000);
  }

  private updateLatency(duration: number): void {
    this.metrics.averageLatency = (this.metrics.averageLatency + duration) / 2;
  }

  getMetrics(): EventStreamingMetrics {
    return { ...this.metrics };
  }

  async getHealth(): Promise<EventStreamingHealth> {
    const issues: string[] = [];
    
    if (!this.isConnected) {
      issues.push('Not connected to Kafka');
    }

    if (this.metrics.errorRate > 0.1) {
      issues.push('High error rate detected');
    }

    const status = issues.length === 0 ? 'healthy' : issues.length > 2 ? 'unhealthy' : 'degraded';

    return {
      status,
      provider: 'kafka',
      connected: this.isConnected,
      lastCheck: new Date(),
      metrics: this.getMetrics(),
      issues,
    };
  }
}

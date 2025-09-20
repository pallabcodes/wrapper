import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
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
export class RedisService implements EventPublisher, EventSubscriber, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private publisher: Redis;
  private subscriber: Redis;
  private config: EventStreamingConfig;
  private handlers: Map<string, EventHandler[]> = new Map();
  private metrics: EventStreamingMetrics;
  private isConnected = false;

  constructor(private configService: ConfigService) {
    this.config = this.configService.get<EventStreamingConfig>('EVENT_STREAMING_CONFIG') || {
      provider: 'redis',
      redis: {
        host: 'localhost',
        port: 6379,
        db: 0,
        keyPrefix: 'ecommerce:events:',
      },
    };

    this.initializeMetrics();
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    try {
      if (!this.config.redis) {
        throw new Error('Redis configuration is required');
      }

      this.publisher = new Redis({
        host: this.config.redis.host,
        port: this.config.redis.port,
        password: this.config.redis.password,
        db: this.config.redis.db,
        keyPrefix: this.config.redis.keyPrefix,
        maxRetriesPerRequest: 3,
      });

      this.subscriber = new Redis({
        host: this.config.redis.host,
        port: this.config.redis.port,
        password: this.config.redis.password,
        db: this.config.redis.db,
        keyPrefix: this.config.redis.keyPrefix,
        maxRetriesPerRequest: 3,
      });

      // Test connection
      await this.publisher.ping();
      await this.subscriber.ping();

      this.isConnected = true;
      this.logger.log('Redis connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      this.isConnected = false;
      throw error;
    }
  }

  private async disconnect() {
    try {
      if (this.publisher) {
        await this.publisher.quit();
      }
      if (this.subscriber) {
        await this.subscriber.quit();
      }
      this.isConnected = false;
      this.logger.log('Redis disconnected');
    } catch (error) {
      this.logger.error('Error disconnecting from Redis:', error);
    }
  }

  async publish(topic: string, message: EventMessage): Promise<void> {
    try {
      const channel = `${topic}:${message.type}`;
      const messageData = JSON.stringify(message);

      await this.publisher.publish(channel, messageData);

      this.updateMetrics('published');
      this.logger.debug(`Event published to channel ${channel}:`, message.id);
    } catch (error) {
      this.updateMetrics('failed');
      this.logger.error(`Failed to publish event to topic ${topic}:`, error);
      throw error;
    }
  }

  async publishBatch(topic: string, messages: EventMessage[]): Promise<void> {
    try {
      const pipeline = this.publisher.pipeline();

      for (const message of messages) {
        const channel = `${topic}:${message.type}`;
        const messageData = JSON.stringify(message);
        pipeline.publish(channel, messageData);
      }

      await pipeline.exec();

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

      const channel = `${topic}:${handler.eventType}`;

      await this.subscriber.subscribe(channel);

      this.subscriber.on('message', async (receivedChannel, message) => {
        if (receivedChannel === channel) {
          await this.handleMessage(message, topic, handler);
        }
      });

      this.logger.log(`Subscribed to channel ${channel} for event type ${handler.eventType}`);
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
          const channel = `${topic}:${eventType}`;
          await this.subscriber.unsubscribe(channel);
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

  private async handleMessage(message: string, topic: string, handler: EventHandler): Promise<void> {
    try {
      const eventMessage = JSON.parse(message) as EventMessage;

      await this.executeHandler(handler, eventMessage);
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

  private async retryHandler(handler: EventHandler, message: EventMessage, error: any): Promise<void> {
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
      issues.push('Not connected to Redis');
    }

    if (this.metrics.errorRate > 0.1) {
      issues.push('High error rate detected');
    }

    const status = issues.length === 0 ? 'healthy' : issues.length > 2 ? 'unhealthy' : 'degraded';

    return {
      status,
      provider: 'redis',
      connected: this.isConnected,
      lastCheck: new Date(),
      metrics: this.getMetrics(),
      issues,
    };
  }
}

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
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
export class RabbitMQService implements EventPublisher, EventSubscriber, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: any = null;
  private channel: any = null;
  private config: EventStreamingConfig;
  private handlers: Map<string, EventHandler[]> = new Map();
  private metrics!: EventStreamingMetrics;
  private isConnected = false;

  constructor(private configService: ConfigService) {
    this.config = this.configService.get<EventStreamingConfig>('EVENT_STREAMING_CONFIG') || {
      provider: 'rabbitmq',
      rabbitmq: {
        url: 'amqp://localhost:5672',
        exchange: 'ecommerce.events',
        queue: 'ecommerce.events.queue',
        routingKey: 'ecommerce.events.*',
        options: {
          durable: true,
          autoDelete: false,
          messageTtl: 3600000,
        },
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
      if (!this.config.rabbitmq) {
        throw new Error('RabbitMQ configuration is required');
      }

      this.connection = await amqp.connect(this.config.rabbitmq.url);
      this.channel = await this.connection.createChannel();

      // Declare exchange
      await this.channel.assertExchange(
        this.config.rabbitmq.exchange,
        'topic',
        {
          durable: this.config.rabbitmq.options?.durable || true,
        }
      );

      this.isConnected = true;
      this.logger.log('RabbitMQ connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ:', error);
      this.isConnected = false;
      throw error;
    }
  }

  private async disconnect() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.isConnected = false;
      this.logger.log('RabbitMQ disconnected');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ:', error);
    }
  }

  async publish(topic: string, message: EventMessage): Promise<void> {
    try {
      const routingKey = `${topic}.${message.type}`;
      const messageBuffer = Buffer.from(JSON.stringify(message));

      const published = this.channel.publish(
        this.config.rabbitmq!.exchange,
        routingKey,
        messageBuffer,
        {
          messageId: message.id,
          timestamp: message.timestamp.getTime(),
          headers: {
            eventType: message.type,
            source: message.source,
            ...message.headers,
          },
          persistent: true,
        }
      );

      if (!published) {
        throw new Error('Failed to publish message to RabbitMQ');
      }

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
      for (const message of messages) {
        await this.publish(topic, message);
      }

      this.logger.debug(`Batch of ${messages.length} events published to topic ${topic}`);
    } catch (error) {
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

      const queueName = `${this.config.rabbitmq!.queue}.${topic}`;
      const routingKey = `${topic}.${handler.eventType}`;

      // Declare queue
      const queue = await this.channel.assertQueue(queueName, {
        durable: this.config.rabbitmq!.options?.durable || true,
        autoDelete: this.config.rabbitmq!.options?.autoDelete || false,
        arguments: {
          'x-message-ttl': this.config.rabbitmq!.options?.messageTtl || 3600000,
        },
      });

      // Bind queue to exchange
      await this.channel.bindQueue(queue.queue, this.config.rabbitmq!.exchange, routingKey);

      // Consume messages
      await this.channel.consume(queue.queue, async (msg: any) => {
        if (msg) {
          await this.handleMessage(msg, topic, handler);
          this.channel.ack(msg);
        }
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

  private async handleMessage(msg: amqp.ConsumeMessage, _topic: string, handler: EventHandler): Promise<void> {
    try {
      const message = JSON.parse(msg.content.toString()) as EventMessage;
      const eventType = msg.properties.headers?.['eventType'] as string;

      if (!eventType || eventType !== handler.eventType) {
        this.logger.warn('Received message with mismatched event type');
        return;
      }

      await this.executeHandler(handler, message);
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
      issues.push('Not connected to RabbitMQ');
    }

    if (this.metrics.errorRate > 0.1) {
      issues.push('High error rate detected');
    }

    const status = issues.length === 0 ? 'healthy' : issues.length > 2 ? 'unhealthy' : 'degraded';

    return {
      status,
      provider: 'rabbitmq',
      connected: this.isConnected,
      lastCheck: new Date(),
      metrics: this.getMetrics(),
      issues,
    };
  }
}

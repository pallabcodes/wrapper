/**
 * Adapter: Redis Event Publisher
 * 
 * Implements EventPublisherPort using Redis
 * Can be swapped for SQS, SNS, Kafka, etc. without changing domain/application
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { EventPublisherPort } from '@domain/ports/event.publisher.port';

@Injectable()
export class RedisEventPublisherAdapter implements EventPublisherPort, OnModuleInit {
  private readonly logger = new Logger(RedisEventPublisherAdapter.name);
  private redis: Redis;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
    });

    this.logger.log('Connected to Redis for event publishing');
  }

  async publish(event: string, data: unknown): Promise<void> {
    try {
      const channel = `events:${event}`;
      const message = JSON.stringify(data);
      
      await this.redis.publish(channel, message);
      this.logger.debug(`Published event: ${event}`, { data });
    } catch (error) {
      this.logger.error(`Failed to publish event: ${event}`, error);
      // Don't throw - events are non-critical
    }
  }
}


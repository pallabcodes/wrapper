import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { EventSubscriberPort } from '@domain/ports/event.subscriber.port';
import { UserRepositoryAdapter } from '../persistence/user.repository.adapter';

@Injectable()
export class RedisEventSubscriberAdapter implements EventSubscriberPort, OnModuleInit {
  private readonly logger = new Logger(RedisEventSubscriberAdapter.name);
  private redis: Redis;
  private subscribers: Map<string, (data: unknown) => Promise<void>> = new Map();

  constructor(
    private configService: ConfigService,
    private userRepository: UserRepositoryAdapter,
  ) {}

  onModuleInit() {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
    });

    // Subscribe to user.registered event
    this.subscribe('user.registered', async (data: any) => {
      this.logger.log('Received user.registered event', data);
      // Create user in User Service when Auth Service registers a user
      await this.userRepository.createFromEvent(
        data.userId,
        data.email,
        data.name,
      );
    });

    this.logger.log('Connected to Redis for event subscription');
  }

  subscribe(event: string, handler: (data: unknown) => Promise<void>): void {
    const channel = `events:${event}`;
    this.subscribers.set(channel, handler);

    this.redis.subscribe(channel, (err) => {
      if (err) {
        this.logger.error(`Failed to subscribe to ${channel}`, err);
      } else {
        this.logger.log(`Subscribed to ${channel}`);
      }
    });

    this.redis.on('message', async (channel, message) => {
      const handler = this.subscribers.get(channel);
      if (handler) {
        try {
          const data = JSON.parse(message);
          await handler(data);
        } catch (error) {
          this.logger.error(`Error handling message from ${channel}`, error);
        }
      }
    });
  }
}


import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { BucketState } from '@domain/entities/token-bucket.entity';
import { IRateLimitRepository } from '@domain/ports/rate-limit-repository.port';
import { config } from '../config/app.config';

/**
 * Infrastructure Adapter: Redis Repository
 * 
 * Implements IRateLimitRepository port
 * (In Hexagonal: adapters/outbound/redis/redis-storage.adapter.ts)
 */
@Injectable()
export class RedisRateLimitRepository implements IRateLimitRepository {
    private readonly redis: Redis;

    constructor() {
        this.redis = new Redis(config.redis);
    }

    async getBucketState(clientId: string, resource: string): Promise<BucketState | null> {
        const key = this.getKey(clientId, resource);
        const data = await this.redis.get(key);
        return data ? JSON.parse(data) : null;
    }

    async saveBucketState(
        clientId: string,
        resource: string,
        state: BucketState,
    ): Promise<void> {
        const key = this.getKey(clientId, resource);
        await this.redis.set(key, JSON.stringify(state), 'EX', 300); // 5 min TTL
    }

    private getKey(clientId: string, resource: string): string {
        return `rate-limit:${clientId}:${resource}`;
    }

    async onModuleDestroy() {
        await this.redis.quit();
    }
}

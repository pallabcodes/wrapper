/**
 * Redis Storage Adapter
 * ---------------------
 * Implements IRateLimitStorage using Redis.
 * Handles serialization and TTL.
 */
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';
import { IRateLimitStorage } from '../../../core/ports/rate-limit-storage.port';
import { BucketState } from '@ratelimiter/common';

@Injectable()
export class RedisStorageAdapter implements IRateLimitStorage, OnModuleInit, OnModuleDestroy {
    private redis: Redis;

    constructor() {
        // In a real app, inject ConfigService here
        this.redis = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: Number(process.env.REDIS_PORT) || 6379,
            lazyConnect: true,
        });
    }

    async onModuleInit() {
        await this.redis.connect();
    }

    async onModuleDestroy() {
        await this.redis.quit();
    }

    async getBucket(key: string): Promise<BucketState | null> {
        const data = await this.redis.get(key); // Redis GET "user123:/api/users"
        if (!data) return null;
        return JSON.parse(data) as BucketState;  // { tokens: 95, lastRefill: 1234567890 }
    }

    async saveBucket(key: string, state: BucketState, ttlSeconds: number): Promise<void> {
        await this.redis.set(key, JSON.stringify(state), 'EX', ttlSeconds);
        // Redis SETEX "user123:/api/users" "{tokens:94,lastRefill:1234567891}" 3600
    }
}

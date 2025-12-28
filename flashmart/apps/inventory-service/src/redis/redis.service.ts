import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit {
    private client: Redis;

    constructor(private readonly config: ConfigService) { }

    onModuleInit() {
        this.client = new Redis({
            host: this.config.get('REDIS_HOST', 'localhost'),
            port: this.config.get('REDIS_PORT', 6379),
        });
    }

    async get(key: string): Promise<string | null> {
        return this.client.get(key);
    }

    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        if (ttlSeconds) {
            await this.client.setex(key, ttlSeconds, value);
        } else {
            await this.client.set(key, value);
        }
    }

    async incr(key: string): Promise<number> {
        return this.client.incr(key);
    }

    async decr(key: string): Promise<number> {
        return this.client.decr(key);
    }

    // Atomic decrement with minimum check (for flash sales)
    async decrementStock(productId: string, quantity: number): Promise<{ success: boolean; remaining: number }> {
        const key = `stock:${productId}`;

        // Lua script for atomic check-and-decrement
        const script = `
      local current = tonumber(redis.call('GET', KEYS[1]) or 0)
      local quantity = tonumber(ARGV[1])
      if current >= quantity then
        local remaining = redis.call('DECRBY', KEYS[1], quantity)
        return {1, remaining}
      else
        return {0, current}
      end
    `;

        const result = await this.client.eval(script, 1, key, quantity) as [number, number];
        return { success: result[0] === 1, remaining: result[1] };
    }

    async setStock(productId: string, quantity: number): Promise<void> {
        await this.client.set(`stock:${productId}`, quantity.toString());
    }

    async getStock(productId: string): Promise<number> {
        const value = await this.client.get(`stock:${productId}`);
        return value ? parseInt(value, 10) : 0;
    }

    // Distributed lock for critical sections
    async acquireLock(key: string, ttlMs: number): Promise<string | null> {
        const lockId = `${Date.now()}-${Math.random()}`;
        const result = await this.client.set(`lock:${key}`, lockId, 'PX', ttlMs, 'NX');
        return result === 'OK' ? lockId : null;
    }

    async releaseLock(key: string, lockId: string): Promise<boolean> {
        const script = `
      if redis.call('GET', KEYS[1]) == ARGV[1] then
        return redis.call('DEL', KEYS[1])
      else
        return 0
      end
    `;
        const result = await this.client.eval(script, 1, `lock:${key}`, lockId);
        return result === 1;
    }
}

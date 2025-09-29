import { Injectable } from '@nestjs/common';
// import Redis from 'ioredis';
import { RateLimitInfo, RateLimitStorage } from './rate-limit.types';

@Injectable()
export class RedisRateLimitStorage implements RateLimitStorage {
  constructor(private readonly redis: { hgetall: (key: string) => Promise<Record<string, string>>; pipeline: () => { hset: (key: string, data: Record<string, string>) => void; pexpire: (key: string, ttl: number) => void; exec: () => Promise<unknown[]> }; eval: (script: string, keys: number, ...args: string[]) => Promise<[number, number, number, number]>; del: (key: string) => Promise<number> }) {}

  async get(key: string): Promise<RateLimitInfo | null> {
    const data = await this.redis.hgetall(key);
    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    return {
      limit: parseInt(data.limit, 10),
      remaining: parseInt(data.remaining, 10),
      resetTime: parseInt(data.resetTime, 10),
    };
  }

  async set(key: string, info: RateLimitInfo, ttlMs: number): Promise<void> {
    const pipeline = this.redis.pipeline();
    pipeline.hset(key, {
      limit: info.limit.toString(),
      remaining: info.remaining.toString(),
      resetTime: info.resetTime.toString(),
    });
    pipeline.pexpire(key, ttlMs);
    await pipeline.exec();
  }

  async increment(key: string, windowMs: number): Promise<RateLimitInfo> {
    const now = Date.now();
    const windowStart = now - windowMs;
    const resetTime = now + windowMs;

    // Use Lua script for atomic operations
    const luaScript = `
      local key = KEYS[1]
      local windowStart = tonumber(ARGV[1])
      local resetTime = tonumber(ARGV[2])
      local limit = tonumber(ARGV[3])
      
      -- Get current data
      local data = redis.call('HMGET', key, 'count', 'windowStart', 'limit')
      local count = tonumber(data[1]) or 0
      local storedWindowStart = tonumber(data[2]) or 0
      local storedLimit = tonumber(data[3]) or limit
      
      -- Reset if window has passed
      if storedWindowStart < windowStart then
        count = 0
        storedWindowStart = windowStart
      end
      
      -- Increment count
      count = count + 1
      
      -- Update data
      redis.call('HMSET', key, 
        'count', count,
        'windowStart', storedWindowStart,
        'limit', storedLimit,
        'remaining', math.max(0, storedLimit - count),
        'resetTime', resetTime
      )
      
      -- Set expiration
      redis.call('PEXPIRE', key, tonumber(ARGV[4]))
      
      return {count, storedLimit, math.max(0, storedLimit - count), resetTime}
    `;

    const result = await this.redis.eval(
      luaScript,
      1,
      key,
      windowStart.toString(),
      resetTime.toString(),
      '1000', // default limit, will be overridden by decorator
      windowMs.toString()
    ) as [number, number, number, number];

    const [, limit, remaining, reset] = result;

    return {
      limit,
      remaining,
      resetTime: reset,
    };
  }

  async reset(key: string): Promise<void> {
    await this.redis.del(key);
  }
}

import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface TierConfig {
  windowMs: number;
  maxRequests: number;
  burstSize: number;
}

/**
 * Redis-backed Rate Limit Service
 * Uses sliding window algorithm for precise rate limiting
 */
@Injectable()
export class RateLimitService {
  private readonly tierConfigs: Record<string, TierConfig> = {
    anonymous: { windowMs: 60000, maxRequests: 30, burstSize: 10 },
    authenticated: { windowMs: 60000, maxRequests: 100, burstSize: 20 },
    premium: { windowMs: 60000, maxRequests: 500, burstSize: 50 },
    internal: { windowMs: 60000, maxRequests: 10000, burstSize: 100 },
  };

  private redis: Redis | null = null;

  constructor(@Inject('REDIS_CLIENT') redis?: Redis) {
    this.redis = redis || null;
  }

  getTierConfig(tier: string): TierConfig {
    return this.tierConfigs[tier] || this.tierConfigs.anonymous;
  }

  async checkLimit(clientId: string, tier: string): Promise<RateLimitResult> {
    const config = this.getTierConfig(tier);
    const now = Date.now();
    const windowStart = now - config.windowMs;
    const key = `ratelimit:${clientId}`;

    // If no Redis, use in-memory fallback
    if (!this.redis) {
      return this.inMemoryCheck(clientId, config, now);
    }

    try {
      // Sliding window with Redis sorted set
      const pipeline = this.redis.pipeline();

      // Remove old entries outside window
      pipeline.zremrangebyscore(key, 0, windowStart);

      // Count requests in current window
      pipeline.zcard(key);

      // Add current request
      pipeline.zadd(key, now, `${now}-${Math.random()}`);

      // Set expiry
      pipeline.expire(key, Math.ceil(config.windowMs / 1000) + 1);

      const results = await pipeline.exec();
      const count = (results?.[1]?.[1] as number) || 0;

      if (count >= config.maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: now + config.windowMs,
          retryAfter: Math.ceil(config.windowMs / 1000),
        };
      }

      return {
        allowed: true,
        remaining: config.maxRequests - count - 1,
        resetTime: now + config.windowMs,
      };
    } catch (error) {
      // Fail open on Redis error
      console.error('Rate limit Redis error:', error.message);
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetTime: now + config.windowMs,
      };
    }
  }

  // In-memory fallback when Redis is unavailable
  private inMemoryBuckets = new Map<string, { count: number; resetTime: number }>();

  private inMemoryCheck(clientId: string, config: TierConfig, now: number): RateLimitResult {
    let bucket = this.inMemoryBuckets.get(clientId);

    if (!bucket || bucket.resetTime < now) {
      bucket = { count: 0, resetTime: now + config.windowMs };
      this.inMemoryBuckets.set(clientId, bucket);
    }

    bucket.count++;

    if (bucket.count > config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: bucket.resetTime,
        retryAfter: Math.ceil((bucket.resetTime - now) / 1000),
      };
    }

    return {
      allowed: true,
      remaining: config.maxRequests - bucket.count,
      resetTime: bucket.resetTime,
    };
  }
}
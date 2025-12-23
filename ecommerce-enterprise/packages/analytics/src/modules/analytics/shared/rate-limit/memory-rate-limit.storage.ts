import { Injectable } from '@nestjs/common';
import { RateLimitInfo, RateLimitStorage } from './rate-limit.types';

interface MemoryRateLimitEntry {
  count: number;
  windowStart: number;
  limit: number;
  resetTime: number;
}

@Injectable()
export class MemoryRateLimitStorage implements RateLimitStorage {
  private storage = new Map<string, MemoryRateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.storage.entries()) {
        if (entry.resetTime < now) {
          this.storage.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  async get(key: string): Promise<RateLimitInfo | null> {
    const entry = this.storage.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (entry.resetTime < now) {
      this.storage.delete(key);
      return null;
    }

    return {
      limit: entry.limit,
      remaining: Math.max(0, entry.limit - entry.count),
      resetTime: entry.resetTime,
    };
  }

  async set(key: string, info: RateLimitInfo, ttlMs: number): Promise<void> {
    const now = Date.now();
    this.storage.set(key, {
      count: info.limit - info.remaining,
      windowStart: now - ttlMs,
      limit: info.limit,
      resetTime: info.resetTime,
    });
  }

  async increment(key: string, windowMs: number): Promise<RateLimitInfo> {
    const now = Date.now();
    const windowStart = now - windowMs;
    const resetTime = now + windowMs;

    const entry = this.storage.get(key);
    let count = 0;
    let limit = 1000; // default limit

    if (entry) {
      // Reset if window has passed
      if (entry.windowStart < windowStart) {
        count = 1;
      } else {
        count = entry.count + 1;
        limit = entry.limit;
      }
    } else {
      count = 1;
    }

    this.storage.set(key, {
      count,
      windowStart,
      limit,
      resetTime,
    });

    return {
      limit,
      remaining: Math.max(0, limit - count),
      resetTime,
    };
  }

  async reset(key: string): Promise<void> {
    this.storage.delete(key);
  }
}

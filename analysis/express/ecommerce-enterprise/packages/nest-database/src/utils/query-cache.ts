import { Injectable } from '@nestjs/common';
import { LRUCache } from 'lru-cache';
import { createHash } from 'crypto';

@Injectable()
export class QueryCache {
  // private readonly logger = new Logger(QueryCache.name);
  private readonly cache: LRUCache<string, unknown>;

  constructor() {
    this.cache = new LRUCache({
      max: 1000,
      ttl: 1000 * 60 * 5, // 5 minutes
    });
  }

  generateKey(sql: string, parameters?: unknown[]): string {
    const content = `${sql}:${JSON.stringify(parameters || [])}`;
    return createHash('md5').update(content).digest('hex');
  }

  async get(key: string): Promise<unknown> {
    return this.cache.get(key);
  }

  async set(key: string, value: unknown, _ttl?: number): Promise<void> {
    this.cache.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  getStats(): {
    size: number;
    max: number;
    ttl: number;
    hits: number;
    misses: number;
  } {
    return {
      size: this.cache.size,
      max: this.cache.max,
      ttl: 0, // LRU cache doesn't provide TTL info by default
      hits: 0, // LRU cache doesn't provide hit/miss stats by default
      misses: 0,
    };
  }
}

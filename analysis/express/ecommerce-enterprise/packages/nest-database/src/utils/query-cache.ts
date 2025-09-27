import { Injectable } from '@nestjs/common';
import LRUCache from 'lru-cache';
import { createHash } from 'crypto';

@Injectable()
export class QueryCache {
  // private readonly logger = new Logger(QueryCache.name);
  private readonly cache: LRUCache<string, any>;

  constructor() {
    this.cache = new LRUCache({
      max: 1000,
      maxAge: 1000 * 60 * 5, // 5 minutes
    });
  }

  generateKey(sql: string, parameters?: any[]): string {
    const content = `${sql}:${JSON.stringify(parameters || [])}`;
    return createHash('md5').update(content).digest('hex');
  }

  async get(key: string): Promise<any> {
    return this.cache.get(key);
  }

  async set(key: string, value: any, _ttl?: number): Promise<void> {
    this.cache.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.cache.del(key);
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
      size: (this.cache as any).length || 0,
      max: (this.cache as any).max || 1000,
      ttl: 0, // LRU cache doesn't provide TTL info by default
      hits: 0, // LRU cache doesn't provide hit/miss stats by default
      misses: 0,
    };
  }
}

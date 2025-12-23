import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

@Injectable()
export class QueryCache {
  // private readonly logger = new Logger(QueryCache.name);
  private readonly cache: Map<string, unknown>;

  constructor() {
    this.cache = new Map();
  }

  generateKey(sql: string, parameters?: unknown[]): string {
    const content = `${sql}:${JSON.stringify(parameters || [])}`;
    return createHash('md5').update(content).digest('hex');
  }

  async get(key: string): Promise<unknown | undefined> {
    return this.cache.get(key);
  }

  async set(key: string, value: unknown, _ttl?: number): Promise<void> {
    if (this.cache.size >= 1000) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
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
      max: 1000,
      ttl: 0,
      hits: 0,
      misses: 0,
    };
  }
}

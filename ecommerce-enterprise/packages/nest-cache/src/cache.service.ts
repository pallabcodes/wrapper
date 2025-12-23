import { Injectable, Inject, Logger } from '@nestjs/common';
import { CacheStore } from './interfaces/cache-store.interface';
import { CacheOptions } from './interfaces/cache-options.interface';
import { CacheKeyBuilder } from './utils/cache-key-builder';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly keyBuilder: CacheKeyBuilder;
  private metrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
  };

  constructor(
    @Inject('CACHE_STORE') private readonly store: CacheStore,
    @Inject('CACHE_OPTIONS') private readonly _options: CacheOptions,
  ) {
    this.keyBuilder = new CacheKeyBuilder(_options.redis?.keyPrefix || 'cache');
  }

  async get<T>(key: string, _options?: { ttl?: number }): Promise<T | undefined> {
    try {
      const fullKey = this.keyBuilder.build(key);
      const entry = await this.store.get<T>(fullKey);
      
      if (entry) {
        this.metrics.hits++;
        this.logger.debug(`Cache hit: ${key}`);
        return entry.value;
      }
      
      this.metrics.misses++;
      this.logger.debug(`Cache miss: ${key}`);
      return undefined;
    } catch (error) {
      this.metrics.errors++;
      this.logger.error(`Cache get error: ${error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)}`, error instanceof Error ? error instanceof Error ? error.stack : undefined : undefined);
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const fullKey = this.keyBuilder.build(key);
      const finalTtl = ttl || this._options.ttl || 3600;
      
      await this.store.set(fullKey, value, finalTtl);
      this.metrics.sets++;
      this.logger.debug(`Cache set: ${key} (TTL: ${finalTtl}s)`);
    } catch (error) {
      this.metrics.errors++;
      this.logger.error(`Cache set error: ${error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)}`, error instanceof Error ? error instanceof Error ? error.stack : undefined : undefined);
    }
  }

  async del(key: string): Promise<void> {
    try {
      const fullKey = this.keyBuilder.build(key);
      await this.store.del(fullKey);
      this.metrics.deletes++;
      this.logger.debug(`Cache delete: ${key}`);
    } catch (error) {
      this.metrics.errors++;
      this.logger.error(`Cache delete error: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const fullKey = this.keyBuilder.build(key);
      return await this.store.exists(fullKey);
    } catch (error) {
      this.metrics.errors++;
      this.logger.error(`Cache exists error: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
      return false;
    }
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    let value = await this.get<T>(key);
    
    if (value === undefined) {
      value = await factory();
      await this.set(key, value, ttl);
    }
    
    return value;
  }

  async refresh<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const fullPattern = this.keyBuilder.build(pattern);
      const keys = await this.store.keys(fullPattern);
      
      if (keys.length > 0) {
        await this.store.mdel(keys);
        this.logger.debug(`Cache invalidated ${keys.length} keys matching pattern: ${pattern}`);
      }
    } catch (error) {
      this.metrics.errors++;
      this.logger.error(`Cache invalidate pattern error: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.store.clear();
      this.logger.debug('Cache cleared');
    } catch (error) {
      this.metrics.errors++;
      this.logger.error(`Cache clear error: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
    }
  }

  async size(): Promise<number> {
    try {
      return await this.store.size();
    } catch (error) {
      this.metrics.errors++;
      this.logger.error(`Cache size error: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
      return 0;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      const fullKey = this.keyBuilder.build(key);
      return await this.store.ttl(fullKey);
    } catch (error) {
      this.metrics.errors++;
      this.logger.error(`Cache TTL error: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
      return -1;
    }
  }

  async expire(key: string, ttl: number): Promise<void> {
    try {
      const fullKey = this.keyBuilder.build(key);
      await this.store.expire(fullKey, ttl);
      this.logger.debug(`Cache expire: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      this.metrics.errors++;
      this.logger.error(`Cache expire error: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
    }
  }

  // Hash operations
  async hget<T>(key: string, field: string): Promise<T | undefined> {
    try {
      const fullKey = this.keyBuilder.build(key);
      return await this.store.hget<T>(fullKey, field);
    } catch (error) {
      this.metrics.errors++;
      this.logger.error(`Cache hget error: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
      return undefined;
    }
  }

  async hset<T>(key: string, field: string, value: T): Promise<void> {
    try {
      const fullKey = this.keyBuilder.build(key);
      await this.store.hset(fullKey, field, value);
      this.logger.debug(`Cache hset: ${key}.${field}`);
    } catch (error) {
      this.metrics.errors++;
      this.logger.error(`Cache hset error: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
    }
  }

  async hgetall<T>(key: string): Promise<Record<string, T>> {
    try {
      const fullKey = this.keyBuilder.build(key);
      return await this.store.hgetall<T>(fullKey);
    } catch (error) {
      this.metrics.errors++;
      this.logger.error(`Cache hgetall error: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
      return {};
    }
  }

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      const fullKey = this.keyBuilder.build(key);
      return await this.store.sadd(fullKey, ...members);
    } catch (error) {
      this.metrics.errors++;
      this.logger.error(`Cache sadd error: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
      return 0;
    }
  }

  async smembers(key: string): Promise<string[]> {
    try {
      const fullKey = this.keyBuilder.build(key);
      return await this.store.smembers(fullKey);
    } catch (error) {
      this.metrics.errors++;
      this.logger.error(`Cache smembers error: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
      return [];
    }
  }

  // Counter operations
  async increment(key: string, value: number = 1): Promise<number> {
    try {
      const fullKey = this.keyBuilder.build(key);
      return await this.store.increment(fullKey, value);
    } catch (error) {
      this.metrics.errors++;
      this.logger.error(`Cache increment error: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
      return 0;
    }
  }

  async decrement(key: string, value: number = 1): Promise<number> {
    try {
      const fullKey = this.keyBuilder.build(key);
      return await this.store.decrement(fullKey, value);
    } catch (error) {
      this.metrics.errors++;
      this.logger.error(`Cache decrement error: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
      return 0;
    }
  }

  // Metrics
  getMetrics() {
    const total = this.metrics.hits + this.metrics.misses;
    const hitRate = total > 0 ? (this.metrics.hits / total) * 100 : 0;
    
    return {
      ...this.metrics,
      hitRate: Math.round(hitRate * 100) / 100,
      total,
    };
  }

  resetMetrics() {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
    };
  }
}

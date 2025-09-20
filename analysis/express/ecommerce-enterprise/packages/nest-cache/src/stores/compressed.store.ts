import { CacheStore, CacheEntry } from '../interfaces/cache-store.interface';
import { gzipSync, gunzipSync } from 'zlib';

export class CompressedStore implements CacheStore {
  constructor(private store: CacheStore) {}

  async get<T>(key: string): Promise<CacheEntry<T> | undefined> {
    const compressed = await this.store.get<Buffer>(key);
    if (!compressed) {
      return undefined;
    }

    try {
      const decompressed = gunzipSync(compressed.value);
      const value = JSON.parse(decompressed.toString());
      return {
        value,
        ttl: compressed.ttl,
        createdAt: compressed.createdAt,
        accessCount: compressed.accessCount,
        lastAccessed: compressed.lastAccessed,
      };
    } catch (error) {
      // If decompression fails, return undefined
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const jsonString = JSON.stringify(value);
      const compressed = gzipSync(Buffer.from(jsonString));
      await this.store.set(key, compressed, ttl);
    } catch (error) {
      // If compression fails, store as-is
      await this.store.set(key, value as any, ttl);
    }
  }

  async del(key: string): Promise<void> {
    await this.store.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.store.exists(key);
  }

  async clear(): Promise<void> {
    await this.store.clear();
  }

  async keys(pattern?: string): Promise<string[]> {
    return this.store.keys(pattern);
  }

  async size(): Promise<number> {
    return this.store.size();
  }

  async ttl(key: string): Promise<number> {
    return this.store.ttl(key);
  }

  async expire(key: string, ttl: number): Promise<void> {
    await this.store.expire(key, ttl);
  }

  async refresh<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    return this.store.refresh(key, factory, ttl);
  }

  async mget<T>(keys: string[]): Promise<Array<CacheEntry<T> | undefined>> {
    return this.store.mget<T>(keys);
  }

  async mset<T>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    await this.store.mset(entries);
  }

  async mdel(keys: string[]): Promise<void> {
    await this.store.mdel(keys);
  }

  async increment(key: string, value?: number): Promise<number> {
    return this.store.increment(key, value);
  }

  async decrement(key: string, value?: number): Promise<number> {
    return this.store.decrement(key, value);
  }

  async hget<T>(key: string, field: string): Promise<T | undefined> {
    return this.store.hget<T>(key, field);
  }

  async hset<T>(key: string, field: string, value: T): Promise<void> {
    await this.store.hset(key, field, value);
  }

  async hdel(key: string, field: string): Promise<void> {
    await this.store.hdel(key, field);
  }

  async hgetall<T>(key: string): Promise<Record<string, T>> {
    return this.store.hgetall<T>(key);
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    return this.store.sadd(key, ...members);
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    return this.store.srem(key, ...members);
  }

  async smembers(key: string): Promise<string[]> {
    return this.store.smembers(key);
  }

  async sismember(key: string, member: string): Promise<boolean> {
    return this.store.sismember(key, member);
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    return this.store.zadd(key, score, member);
  }

  async zrem(key: string, member: string): Promise<number> {
    return this.store.zrem(key, member);
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.store.zrange(key, start, stop);
  }

  async zrangebyscore(key: string, min: number, max: number): Promise<string[]> {
    return this.store.zrangebyscore(key, min, max);
  }
}


import { CacheStore, CacheEntry } from '../interfaces/cache-store.interface';
import LRUCache from 'lru-cache';

export class MemoryLRUStore implements CacheStore {
  private cache: LRUCache<string, CacheEntry>;

  constructor(options: { max: number; ttl?: number } = { max: 1000 }) {
    this.cache = new LRUCache({
      max: options.max,
      maxAge: options.ttl || 1000 * 60 * 60, // 1 hour default
    });
  }

  async get<T>(key: string): Promise<CacheEntry<T> | undefined> {
    return this.cache.get(key) as CacheEntry<T> | undefined;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const entry: CacheEntry<T> = {
      value,
      ttl: ttl || 1000 * 60 * 60,
      createdAt: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now(),
    };
    this.cache.set(key, entry);
  }

  async del(key: string): Promise<void> {
    this.cache.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.cache.has(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async keys(pattern?: string): Promise<string[]> {
    const allKeys = Array.from(this.cache.keys());
    if (!pattern) {
      return allKeys;
    }
    
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return allKeys.filter(key => regex.test(key));
  }

  async size(): Promise<number> {
    return this.cache.size;
  }

  async ttl(key: string): Promise<number> {
    const entry = this.cache.get(key);
    if (!entry) return -1;
    return entry.ttl || -1;
  }

  async expire(key: string, ttl: number): Promise<void> {
    const entry = this.cache.get(key);
    if (entry) {
      entry.ttl = ttl;
      this.cache.set(key, entry);
    }
  }

  async refresh<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const existing = this.cache.get(key);
    if (existing) {
      return existing.value as T;
    }
    
    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  async mget<T>(keys: string[]): Promise<Array<CacheEntry<T> | undefined>> {
    return keys.map(key => this.cache.get(key) as CacheEntry<T> | undefined);
  }

  async mset<T>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    for (const { key, value, ttl } of entries) {
      await this.set(key, value, ttl);
    }
  }

  async mdel(keys: string[]): Promise<void> {
    for (const key of keys) {
      this.cache.del(key);
    }
  }

  async increment(key: string, value: number = 1): Promise<number> {
    const existing = this.cache.get(key);
    const current = existing ? (existing.value as number) || 0 : 0;
    const newValue = current + value;
    await this.set(key, newValue as any);
    return newValue;
  }

  async decrement(key: string, value: number = 1): Promise<number> {
    return this.increment(key, -value);
  }

  async hget<T>(key: string, field: string): Promise<T | undefined> {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    const hash = entry.value as Record<string, T>;
    return hash[field];
  }

  async hset<T>(key: string, field: string, value: T): Promise<void> {
    const entry = this.cache.get(key);
    const hash = entry ? (entry.value as Record<string, T>) || {} : {};
    hash[field] = value;
    await this.set(key, hash as any);
  }

  async hdel(key: string, field: string): Promise<void> {
    const entry = this.cache.get(key);
    if (entry) {
      const hash = entry.value as Record<string, any>;
      delete hash[field];
      await this.set(key, hash as any);
    }
  }

  async hgetall<T>(key: string): Promise<Record<string, T>> {
    const entry = this.cache.get(key);
    return entry ? (entry.value as Record<string, T>) || {} : {};
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    const entry = this.cache.get(key);
    const set = entry ? (entry.value as Set<string>) || new Set() : new Set();
    let added = 0;
    for (const member of members) {
      if (!set.has(member)) {
        set.add(member);
        added++;
      }
    }
    await this.set(key, set as any);
    return added;
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    const entry = this.cache.get(key);
    if (!entry) return 0;
    const set = entry.value as Set<string>;
    let removed = 0;
    for (const member of members) {
      if (set.has(member)) {
        set.delete(member);
        removed++;
      }
    }
    await this.set(key, set as any);
    return removed;
  }

  async smembers(key: string): Promise<string[]> {
    const entry = this.cache.get(key);
    if (!entry) return [];
    const set = entry.value as Set<string>;
    return Array.from(set);
  }

  async sismember(key: string, member: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;
    const set = entry.value as Set<string>;
    return set.has(member);
  }

  async zadd(key: string, score: number, member: string): Promise<number> {
    const entry = this.cache.get(key);
    const zset = entry ? (entry.value as Map<string, number>) || new Map() : new Map();
    const isNew = !zset.has(member);
    zset.set(member, score);
    await this.set(key, zset as any);
    return isNew ? 1 : 0;
  }

  async zrem(key: string, member: string): Promise<number> {
    const entry = this.cache.get(key);
    if (!entry) return 0;
    const zset = entry.value as Map<string, number>;
    const existed = zset.has(member);
    zset.delete(member);
    await this.set(key, zset as any);
    return existed ? 1 : 0;
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    const entry = this.cache.get(key);
    if (!entry) return [];
    const zset = entry.value as Map<string, number>;
    const sorted = Array.from(zset.entries()).sort((a, b) => a[1] - b[1]);
    return sorted.slice(start, stop + 1).map(([member]) => member);
  }

  async zrangebyscore(key: string, min: number, max: number): Promise<string[]> {
    const entry = this.cache.get(key);
    if (!entry) return [];
    const zset = entry.value as Map<string, number>;
    return Array.from(zset.entries())
      .filter(([, score]) => score >= min && score <= max)
      .sort((a, b) => a[1] - b[1])
      .map(([member]) => member);
  }
}


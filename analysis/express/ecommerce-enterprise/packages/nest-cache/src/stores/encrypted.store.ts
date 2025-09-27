import { CacheStore, CacheEntry } from '../interfaces/cache-store.interface';
import { createCipher, createDecipher } from 'crypto';

export class EncryptedStore implements CacheStore {
  private algorithm = 'aes-256-cbc';
  private key: Buffer;

  constructor(private store: CacheStore, encryptionKey?: string) {
    this.key = Buffer.from(encryptionKey || 'default-key-32-chars-long!', 'utf8');
  }

  async get<T>(key: string): Promise<CacheEntry<T> | undefined> {
    const encrypted = await this.store.get<string>(key);
    if (!encrypted) {
      return undefined;
    }

    try {
      const decipher = createDecipher(this.algorithm, this.key);
      let decrypted = decipher.update(encrypted.value, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      const value = JSON.parse(decrypted);
      return {
        value,
        ttl: encrypted.ttl || 0,
        createdAt: encrypted.createdAt,
        accessCount: encrypted.accessCount,
        lastAccessed: encrypted.lastAccessed,
      };
    } catch (error) {
      // If decryption fails, return undefined
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const jsonString = JSON.stringify(value);
      const cipher = createCipher(this.algorithm, this.key);
      let encrypted = cipher.update(jsonString, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      await this.store.set(key, encrypted, ttl);
    } catch (error) {
      // If encryption fails, store as-is
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

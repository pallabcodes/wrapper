import { Cluster } from 'ioredis';
import { CacheStore, CacheEntry } from '../interfaces/cache-store.interface';

export interface RedisClusterOptions {
  cluster: {
    nodes: string[];
    options?: any;
  };
  keyPrefix?: string;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
}

export class RedisClusterStore implements CacheStore {
  private redis: Cluster;
  private keyPrefix: string;

  constructor(options: RedisClusterOptions) {
    this.keyPrefix = options.keyPrefix || 'cache';
    
    this.redis = new Cluster(options.cluster.nodes, {
      redisOptions: {
        retryDelayOnFailover: options.retryDelayOnFailover || 100,
        maxRetriesPerRequest: options.maxRetriesPerRequest || 3,
        lazyConnect: true,
        ...options.cluster.options,
      },
    });

    this.redis.on('error', (error) => {
      console.error('Redis cluster error:', error);
    });
  }

  private buildKey(key: string): string {
    return `${this.keyPrefix}:${key}`;
  }

  async get<T>(key: string): Promise<CacheEntry<T> | undefined> {
    try {
      const fullKey = this.buildKey(key);
      const data = await this.redis.get(fullKey);
      
      if (!data) {
        return undefined;
      }

      const entry = JSON.parse(data) as CacheEntry<T>;
      
      // Check TTL
      if (entry.ttl && Date.now() - entry.createdAt > entry.ttl * 1000) {
        await this.del(key);
        return undefined;
      }

      // Update access info
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      
      // Update in background
      setImmediate(() => {
        this.redis.set(fullKey, JSON.stringify(entry), 'EX', entry.ttl || 3600);
      });

      return entry;
    } catch (error) {
      console.error('Redis get error:', error);
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const fullKey = this.buildKey(key);
      const entry: CacheEntry<T> = {
        value,
        ttl: ttl || 3600,
        createdAt: Date.now(),
        accessCount: 0,
        lastAccessed: Date.now(),
      };

      const serialized = JSON.stringify(entry);
      
      if (ttl) {
        await this.redis.setex(fullKey, ttl, serialized);
      } else {
        await this.redis.set(fullKey, serialized);
      }
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      const fullKey = this.buildKey(key);
      await this.redis.del(fullKey);
    } catch (error) {
      console.error('Redis del error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key);
      const result = await this.redis.exists(fullKey);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  async keys(pattern?: string): Promise<string[]> {
    try {
      const searchPattern = pattern ? this.buildKey(pattern) : `${this.keyPrefix}:*`;
      const keys = await this.redis.keys(searchPattern);
      return keys.map(key => key.replace(`${this.keyPrefix}:`, ''));
    } catch (error) {
      console.error('Redis keys error:', error);
      return [];
    }
  }

  async clear(): Promise<void> {
    try {
      const pattern = `${this.keyPrefix}:*`;
      const keys = await this.redis.keys(pattern);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Redis clear error:', error);
    }
  }

  async size(): Promise<number> {
    try {
      const pattern = `${this.keyPrefix}:*`;
      const keys = await this.redis.keys(pattern);
      return keys.length;
    } catch (error) {
      console.error('Redis size error:', error);
      return 0;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      const fullKey = this.buildKey(key);
      return await this.redis.ttl(fullKey);
    } catch (error) {
      console.error('Redis ttl error:', error);
      return -1;
    }
  }

  async expire(key: string, ttl: number): Promise<void> {
    try {
      const fullKey = this.buildKey(key);
      await this.redis.expire(fullKey, ttl);
    } catch (error) {
      console.error('Redis expire error:', error);
    }
  }

  async refresh<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  async mget<T>(keys: string[]): Promise<Array<CacheEntry<T> | undefined>> {
    try {
      const fullKeys = keys.map(key => this.buildKey(key));
      const values = await this.redis.mget(...fullKeys);
      
      return values.map((value, index) => {
        if (!value) return undefined;
        
        try {
          const entry = JSON.parse(value) as CacheEntry<T>;
          
          // Check TTL
          if (entry.ttl && Date.now() - entry.createdAt > entry.ttl * 1000) {
            this.del(keys[index]);
            return undefined;
          }
          
          return entry;
        } catch {
          return undefined;
        }
      });
    } catch (error) {
      console.error('Redis mget error:', error);
      return keys.map(() => undefined);
    }
  }

  async mset<T>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();
      
      for (const entry of entries) {
        const fullKey = this.buildKey(entry.key);
        const cacheEntry: CacheEntry<T> = {
          value: entry.value,
          ttl: entry.ttl || 3600,
          createdAt: Date.now(),
          accessCount: 0,
          lastAccessed: Date.now(),
        };
        
        const serialized = JSON.stringify(cacheEntry);
        
        if (entry.ttl) {
          pipeline.setex(fullKey, entry.ttl, serialized);
        } else {
          pipeline.set(fullKey, serialized);
        }
      }
      
      await pipeline.exec();
    } catch (error) {
      console.error('Redis mset error:', error);
    }
  }

  async mdel(keys: string[]): Promise<void> {
    try {
      const fullKeys = keys.map(key => this.buildKey(key));
      await this.redis.del(...fullKeys);
    } catch (error) {
      console.error('Redis mdel error:', error);
    }
  }

  async increment(key: string, value: number = 1): Promise<number> {
    try {
      const fullKey = this.buildKey(key);
      return await this.redis.incrby(fullKey, value);
    } catch (error) {
      console.error('Redis increment error:', error);
      return 0;
    }
  }

  async decrement(key: string, value: number = 1): Promise<number> {
    try {
      const fullKey = this.buildKey(key);
      return await this.redis.decrby(fullKey, value);
    } catch (error) {
      console.error('Redis decrement error:', error);
      return 0;
    }
  }

  // Hash operations
  async hget<T>(key: string, field: string): Promise<T | undefined> {
    try {
      const fullKey = this.buildKey(key);
      const value = await this.redis.hget(fullKey, field);
      return value ? JSON.parse(value) : undefined;
    } catch (error) {
      console.error('Redis hget error:', error);
      return undefined;
    }
  }

  async hset<T>(key: string, field: string, value: T): Promise<void> {
    try {
      const fullKey = this.buildKey(key);
      await this.redis.hset(fullKey, field, JSON.stringify(value));
    } catch (error) {
      console.error('Redis hset error:', error);
    }
  }

  async hdel(key: string, field: string): Promise<void> {
    try {
      const fullKey = this.buildKey(key);
      await this.redis.hdel(fullKey, field);
    } catch (error) {
      console.error('Redis hdel error:', error);
    }
  }

  async hgetall<T>(key: string): Promise<Record<string, T>> {
    try {
      const fullKey = this.buildKey(key);
      const hash = await this.redis.hgetall(fullKey);
      
      const result: Record<string, T> = {};
      for (const [field, value] of Object.entries(hash)) {
        try {
          result[field] = JSON.parse(value);
        } catch {
          result[field] = value as T;
        }
      }
      
      return result;
    } catch (error) {
      console.error('Redis hgetall error:', error);
      return {};
    }
  }

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      const fullKey = this.buildKey(key);
      return await this.redis.sadd(fullKey, ...members);
    } catch (error) {
      console.error('Redis sadd error:', error);
      return 0;
    }
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    try {
      const fullKey = this.buildKey(key);
      return await this.redis.srem(fullKey, ...members);
    } catch (error) {
      console.error('Redis srem error:', error);
      return 0;
    }
  }

  async smembers(key: string): Promise<string[]> {
    try {
      const fullKey = this.buildKey(key);
      return await this.redis.smembers(fullKey);
    } catch (error) {
      console.error('Redis smembers error:', error);
      return [];
    }
  }

  async sismember(key: string, member: string): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key);
      const result = await this.redis.sismember(fullKey, member);
      return result === 1;
    } catch (error) {
      console.error('Redis sismember error:', error);
      return false;
    }
  }

  // Sorted set operations
  async zadd(key: string, score: number, member: string): Promise<number> {
    try {
      const fullKey = this.buildKey(key);
      return await this.redis.zadd(fullKey, score, member);
    } catch (error) {
      console.error('Redis zadd error:', error);
      return 0;
    }
  }

  async zrem(key: string, member: string): Promise<number> {
    try {
      const fullKey = this.buildKey(key);
      return await this.redis.zrem(fullKey, member);
    } catch (error) {
      console.error('Redis zrem error:', error);
      return 0;
    }
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      const fullKey = this.buildKey(key);
      return await this.redis.zrange(fullKey, start, stop);
    } catch (error) {
      console.error('Redis zrange error:', error);
      return [];
    }
  }

  async zrangebyscore(key: string, min: number, max: number): Promise<string[]> {
    try {
      const fullKey = this.buildKey(key);
      return await this.redis.zrangebyscore(fullKey, min, max);
    } catch (error) {
      console.error('Redis zrangebyscore error:', error);
      return [];
    }
  }

  async disconnect(): Promise<void> {
    await this.redis.disconnect();
  }
}

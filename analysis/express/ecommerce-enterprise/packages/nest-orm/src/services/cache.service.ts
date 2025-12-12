import { Injectable, Logger } from '@nestjs/common';
import Redis, { RedisOptions } from 'ioredis';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private redis!: Redis;
  private isConnectedFlag = false;

  constructor() {
    this.connect();
  }

  async connect(): Promise<void> {
    try {
      const redisOptions: RedisOptions = {
        host: process.env['REDIS_HOST'] || 'localhost',
        port: parseInt(process.env['REDIS_PORT'] || '6379'),
        enableReadyCheck: false,
        maxRetriesPerRequest: 3,
      };
      
      this.redis = new Redis(redisOptions);

      this.redis.on('connect', () => {
        this.isConnectedFlag = true;
        this.logger.log('Redis connected successfully');
      });

      this.redis.on('error', (error: Error) => {
        this.logger.error('Redis connection error', error);
        this.isConnectedFlag = false;
      });

    } catch (error) {
      this.logger.error('Failed to connect to Redis', error);
      this.isConnectedFlag = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.redis.disconnect();
      this.isConnectedFlag = false;
      this.logger.log('Redis disconnected successfully');
    } catch (error) {
      this.logger.error('Failed to disconnect from Redis', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.isConnectedFlag;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) {
        return null;
      }
      
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Failed to get cache key: ${key}`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      
      if (ttl) {
        await this.redis.setex(key, ttl, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
    } catch (error) {
      this.logger.error(`Failed to set cache key: ${key}`, error);
      throw error;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Failed to delete cache key: ${key}`, error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to check cache key existence: ${key}`, error);
      return false;
    }
  }

  async expire(key: string, ttl: number): Promise<void> {
    try {
      await this.redis.expire(key, ttl);
    } catch (error) {
      this.logger.error(`Failed to set cache key expiration: ${key}`, error);
      throw error;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      this.logger.error(`Failed to get cache key TTL: ${key}`, error);
      return -1;
    }
  }

  async flush(): Promise<void> {
    try {
      await this.redis.flushdb();
    } catch (error) {
      this.logger.error('Failed to flush cache', error);
      throw error;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.redis.keys(pattern);
    } catch (error) {
      this.logger.error(`Failed to get cache keys with pattern: ${pattern}`, error);
      return [];
    }
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await this.redis.mget(...keys);
      return values.map(value => value ? JSON.parse(value) as T : null);
    } catch (error) {
      this.logger.error(`Failed to get multiple cache keys`, error);
      return keys.map(() => null);
    }
  }

  async mset<T>(keyValuePairs: Record<string, T>, ttl?: number): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();
      
      Object.entries(keyValuePairs).forEach(([key, value]) => {
        const serialized = JSON.stringify(value);
        if (ttl) {
          pipeline.setex(key, ttl, serialized);
        } else {
          pipeline.set(key, serialized);
        }
      });
      
      await pipeline.exec();
    } catch (error) {
      this.logger.error(`Failed to set multiple cache keys`, error);
      throw error;
    }
  }

  async getStats(): Promise<{
    connected: boolean;
    memory: Record<string, string>;
    keys: number;
    hitRate: number;
  }> {
    try {
      const info = await this.redis.info('memory');
      const keys = await this.redis.dbsize();
      
      // Parse memory info
      const memoryInfo: Record<string, string> = {};
      info.split('\r\n').forEach((line: string) => {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          memoryInfo[key] = value;
        }
      });
      
      return {
        connected: this.isConnectedFlag,
        memory: memoryInfo,
        keys,
        hitRate: 0 // Would need to track hits/misses
      };
    } catch (error) {
      this.logger.error('Failed to get cache stats', error);
      return {
        connected: false,
        memory: {},
        keys: 0,
        hitRate: 0
      };
    }
  }
}

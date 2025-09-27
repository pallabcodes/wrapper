import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheOptions } from '../interfaces/enterprise-options.interface';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis | null = null;
  private memoryCache = new Map<string, { value: any; expires: number }>();
  private options!: CacheOptions;

  constructor(private readonly configService: ConfigService) {
    this.initializeCache();
  }

  private async initializeCache() {
    try {
      this.options = this.configService.get<CacheOptions>('CACHE_CONFIG', {
        enabled: false,
        ttl: 300,
        maxSize: 1000,
        provider: 'memory',
      });

      if (!this.options.enabled) {
        this.logger.warn('Cache is disabled');
        return;
      }

      if (this.options.provider === 'redis' && this.options.redis) {
        this.redis = new Redis({
          host: this.options.redis.host,
          port: this.options.redis.port,
          password: this.options.redis.password,
          db: this.options.redis.db || 0,
          enableReadyCheck: false,
          maxRetriesPerRequest: 3,
        });

        (this.redis as any).on('error', (error: Error) => {
          this.logger.error(`Redis error: ${error.message}`);
        });

        (this.redis as any).on('connect', () => {
          this.logger.log('Redis connected successfully');
        });
      }

      this.logger.log(`Cache initialized with provider: ${this.options.provider}`);
    } catch (error) {
      this.logger.error(`Cache initialization failed: ${(error as Error).message}`, (error as Error).stack);
    }
  }

  async get(key: string): Promise<any> {
    if (!this.options.enabled) {
      return null;
    }

    try {
      if (this.redis) {
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : null;
      } else {
        const cached = this.memoryCache.get(key);
        if (cached && cached.expires > Date.now()) {
          return cached.value;
        } else if (cached) {
          this.memoryCache.delete(key);
        }
        return null;
      }
    } catch (error) {
      this.logger.error(`Cache get failed for key: ${key}`, (error as Error).stack);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.options.enabled) {
      return;
    }

    try {
      const actualTtl = ttl || this.options.ttl;

      if (this.redis) {
        await this.redis.setex(key, actualTtl, JSON.stringify(value));
      } else {
        // Memory cache with size limit
        if (this.memoryCache.size >= this.options.maxSize) {
          const firstKey = this.memoryCache.keys().next().value;
          if (firstKey) {
            this.memoryCache.delete(firstKey);
          }
        }

        this.memoryCache.set(key, {
          value,
          expires: Date.now() + (actualTtl * 1000),
        });
      }
    } catch (error) {
      this.logger.error(`Cache set failed for key: ${key}`, (error as Error).stack);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.options.enabled) {
      return;
    }

    try {
      if (this.redis) {
        await this.redis.del(key);
      } else {
        this.memoryCache.delete(key);
      }
    } catch (error) {
      this.logger.error(`Cache delete failed for key: ${key}`, (error as Error).stack);
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    if (!this.options.enabled) {
      return;
    }

    try {
      if (this.redis) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await (this.redis as any).del(...keys);
        }
      } else {
        // Memory cache pattern matching
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        for (const key of this.memoryCache.keys()) {
          if (regex.test(key)) {
            this.memoryCache.delete(key);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Cache delete pattern failed for pattern: ${pattern}`, (error as Error).stack);
    }
  }

  async clear(): Promise<void> {
    if (!this.options.enabled) {
      return;
    }

    try {
      if (this.redis) {
        await (this.redis as any).flushAll();
      } else {
        this.memoryCache.clear();
      }
    } catch (error) {
      this.logger.error('Cache clear failed', (error as Error).stack);
    }
  }

  async getStats(): Promise<any> {
    if (!this.options.enabled) {
      return { enabled: false };
    }

    try {
      if (this.redis) {
        try {
          const info = await (this.redis as any).info('memory');
          const dbsize = await (this.redis as any).dbSize();
          
          return {
            provider: 'redis',
            enabled: true,
            size: dbsize,
            info: this.parseRedisInfo(info),
          };
        } catch (redisError) {
          this.logger.warn('Redis not available, falling back to memory cache stats');
          return {
            provider: 'memory',
            enabled: true,
            size: this.memoryCache.size,
            maxSize: this.options.maxSize,
          };
        }
      } else {
        return {
          provider: 'memory',
          enabled: true,
          size: this.memoryCache.size,
          maxSize: this.options.maxSize,
        };
      }
    } catch (error) {
      this.logger.error('Cache stats failed', (error as Error).stack);
      return { enabled: false, error: (error as Error).message };
    }
  }

  private parseRedisInfo(info: string): any {
    const lines = info.split('\r\n');
    const result: any = {};

    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        if (key) {
          result[key] = value;
        }
      }
    }

    return result;
  }

  async isHealthy(): Promise<boolean> {
    if (!this.options.enabled) {
      return true;
    }

    try {
      if (this.redis) {
        await (this.redis as any).ping();
        return true;
      } else {
        return true; // Memory cache is always healthy
      }
    } catch (error) {
      this.logger.error('Cache health check failed', (error as Error).stack);
      return false;
    }
  }
}

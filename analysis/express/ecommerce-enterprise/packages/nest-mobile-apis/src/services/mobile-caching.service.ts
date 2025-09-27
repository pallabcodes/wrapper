import { Injectable, Logger } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
const { LRUCache } = require('lru-cache');
import {
  CacheOptions,
  MobileDeviceInfo,
  OfflineData,
} from '../interfaces/mobile-api.interface';

@Injectable()
export class MobileCachingService {
  private readonly logger = new Logger(MobileCachingService.name);
  private offlineCache: any;
  private memoryCache: any;

  constructor(
    // private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    this.offlineCache = new LRUCache({
      max: 10000,
      ttl: 1000 * 60 * 60 * 24, // 24 hours
    });

    this.memoryCache = new LRUCache({
      max: 1000,
      ttl: 1000 * 60 * 5, // 5 minutes
    });
  }

  async get<T>(key: string, _options?: Partial<CacheOptions>): Promise<T | null> {
    try {
      // Try memory cache first
      const memoryCached = this.memoryCache.get(key);
      if (memoryCached) {
        this.logger.debug(`Cache hit (memory): ${key}`);
        return memoryCached as T;
      }

      // Try distributed cache
      const cached = await this.cacheManager.get<T>(key);
      if (cached) {
        this.logger.debug(`Cache hit (distributed): ${key}`);
        // Store in memory cache for faster access
        this.memoryCache.set(key, cached);
        return cached;
      }

      this.logger.debug(`Cache miss: ${key}`);
      return null;
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  buildTenantAwareKey(baseKey: string, context?: { tenantId?: string; userId?: string; device?: Partial<MobileDeviceInfo> }): string {
    const tenant = context?.tenantId || 'public';
    const user = context?.userId ? `u:${context.userId}` : 'u:anon';
    const platform = context?.device?.platform || 'unknown';
    return `t:${tenant}:${user}:${platform}:${baseKey}`;
  }

  async set<T>(key: string, value: T, options?: Partial<CacheOptions>): Promise<void> {
    try {
      const ttl = options?.ttl || 300; // 5 minutes default

      // Set in memory cache
      this.memoryCache.set(key, value, { ttl: ttl * 1000 });

      // Set in distributed cache
      await this.cacheManager.set(key, value, ttl);

      this.logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      this.memoryCache.delete(key);
      await this.cacheManager.del(key);
      this.logger.debug(`Cache deleted: ${key}`);
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}:`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      this.memoryCache.clear();
      await this.cacheManager.reset();
      this.logger.log('All caches cleared');
    } catch (error) {
      this.logger.error('Cache clear error:', error);
    }
  }

  async getOfflineData(userId: string, _type?: string): Promise<OfflineData[]> {
    // const pattern = type ? `${userId}:${type}:*` : `${userId}:*`;
    const keys = Array.from(this.offlineCache.keys()).filter((key: unknown): key is string => 
      typeof key === 'string' && key.startsWith(userId)
    );
    
    return keys.map((key: string) => this.offlineCache.get(key)!).filter(Boolean);
  }

  async setOfflineData(data: OfflineData, userId: string): Promise<void> {
    const key = `${userId}:${data.type}:${data.id}`;
    this.offlineCache.set(key, data);
    this.logger.debug(`Offline data cached: ${key}`);
  }

  async updateOfflineData(data: OfflineData, userId: string): Promise<void> {
    const key = `${userId}:${data.type}:${data.id}`;
    const existing = this.offlineCache.get(key);
    
    if (existing) {
      data.version = existing.version + 1;
      data.syncStatus = 'pending';
    }
    
    this.offlineCache.set(key, data);
    this.logger.debug(`Offline data updated: ${key}`);
  }

  async deleteOfflineData(dataId: string, type: string, userId: string): Promise<void> {
    const key = `${userId}:${type}:${dataId}`;
    this.offlineCache.delete(key);
    this.logger.debug(`Offline data deleted: ${key}`);
  }

  async getOfflineDataByType(userId: string, type: string): Promise<OfflineData[]> {
    const pattern = `${userId}:${type}:*`;
    const keys = Array.from(this.offlineCache.keys()).filter((key: unknown): key is string => 
      typeof key === 'string' && key.startsWith(pattern)
    );
    
    return keys.map((key: string) => this.offlineCache.get(key)!).filter(Boolean);
  }

  async syncOfflineData(userId: string): Promise<{
    synced: number;
    conflicts: number;
    errors: number;
  }> {
    const offlineData = await this.getOfflineData(userId);
    let synced = 0;
    let conflicts = 0;
    let errors = 0;

    for (const data of offlineData) {
      try {
        if (data.syncStatus === 'pending') {
          // Simulate sync with server
          await this.simulateServerSync(data);
          data.syncStatus = 'synced';
          synced++;
        } else if (data.syncStatus === 'conflict') {
          conflicts++;
        }
      } catch (error) {
        this.logger.error(`Sync error for data ${data.id}:`, error);
        errors++;
      }
    }

    return { synced, conflicts, errors };
  }

  private async simulateServerSync(data: OfflineData): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate potential conflicts
    if (Math.random() < 0.1) {
      data.syncStatus = 'conflict';
    }
  }

  async getCacheStats(): Promise<{
    memory: {
      size: number;
      maxSize: number;
      hitRate: number;
    };
    offline: {
      size: number;
      maxSize: number;
      pendingSync: number;
    };
  }> {
    const memoryStats = this.memoryCache.dump();
    const offlineStats = this.offlineCache.dump();
    
    const pendingSync = Array.from(this.offlineCache.values())
      .filter(data => (data as any)?.syncStatus === 'pending').length;

    return {
      memory: {
        size: memoryStats.length,
        maxSize: this.memoryCache.max,
        hitRate: 0, // Would need to track hits/misses
      },
      offline: {
        size: offlineStats.length,
        maxSize: this.offlineCache.max,
        pendingSync,
      },
    };
  }

  async invalidateByTag(tag: string): Promise<void> {
    try {
      // This would need to be implemented with a tag-based cache system
      // For now, we'll clear all caches
      await this.clear();
      this.logger.log(`Cache invalidated by tag: ${tag}`);
    } catch (error) {
      this.logger.error(`Cache invalidation error for tag ${tag}:`, error);
    }
  }

  async warmupCache(keys: string[], dataFetcher: (key: string) => Promise<any>): Promise<void> {
    this.logger.log(`Warming up cache with ${keys.length} keys`);
    
    const promises = keys.map(async (key) => {
      try {
        const data = await dataFetcher(key);
        await this.set(key, data);
      } catch (error) {
        this.logger.error(`Cache warmup error for key ${key}:`, error);
      }
    });

    await Promise.all(promises);
    this.logger.log('Cache warmup completed');
  }
}

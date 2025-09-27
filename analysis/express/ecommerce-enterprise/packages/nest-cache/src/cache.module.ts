import { Module, DynamicModule, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';
import { CacheOptions } from './interfaces/cache-options.interface';
import { RedisClusterStore } from './stores/redis-cluster.store';
import { MemoryLRUStore } from './stores/memory-lru.store';
import { CompressedStore } from './stores/compressed.store';
import { EncryptedStore } from './stores/encrypted.store';

@Module({})
export class CacheModule {
  static forRoot(options: CacheOptions = {}): DynamicModule {
    const providers: Provider[] = [
      {
        provide: 'CACHE_OPTIONS',
        useValue: options,
      },
      CacheService,
    ];

    // Add store providers based on configuration
    if (options.redis?.enabled) {
      providers.push({
        provide: 'CACHE_STORE',
        useFactory: (configService: ConfigService) => {
          const redisOptions = {
            ...options.redis,
            ...configService.get('REDIS_CONFIG', {}),
          };
          return new RedisClusterStore(redisOptions);
        },
        inject: [ConfigService],
      });
    } else if (options.memory?.enabled) {
      providers.push({
        provide: 'CACHE_STORE',
        useFactory: () => {
          return new MemoryLRUStore({ 
            max: options.memory?.maxSize || 1000, 
            ...(options.memory?.ttl && { ttl: options.memory.ttl })
          });
        },
      });
    }

    // Add compression layer if enabled
    if (options.compression?.enabled) {
      providers.push({
        provide: 'CACHE_COMPRESSION',
        useFactory: (store: any) => new CompressedStore(store),
      });
    }

    // Add encryption layer if enabled
    if (options.encryption?.enabled) {
      providers.push({
        provide: 'CACHE_ENCRYPTION',
        useFactory: (store: any) => new EncryptedStore(store, options.encryption?.key),
      });
    }

    return {
      module: CacheModule,
      providers,
      exports: [CacheService],
      global: options.global || false,
    };
  }

  static forRootAsync(options: {
    useFactory: (...args: any[]) => Promise<CacheOptions> | CacheOptions;
    inject?: any[];
  }): DynamicModule {
    const providers: Provider[] = [
      {
        provide: 'CACHE_OPTIONS',
        useFactory: options.useFactory,
        inject: options.inject || [],
      },
      CacheService,
    ];

    return {
      module: CacheModule,
      providers,
      exports: [CacheService],
      global: false,
    };
  }
}

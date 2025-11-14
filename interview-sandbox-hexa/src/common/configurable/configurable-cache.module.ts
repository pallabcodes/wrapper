import { ConfigurableModuleBuilder, Module } from '@nestjs/common';

/**
 * Cache Module Options Interface
 */
export interface CacheModuleOptions {
  ttl: number;              // Time to live in seconds
  maxSize: number;          // Maximum cache size
  strategy: 'lru' | 'fifo'; // Eviction strategy
  enabled: boolean;         // Enable/disable cache
}

/**
 * Configurable Cache Module
 * 
 * Demonstrates ConfigurableModuleBuilder pattern
 * 
 * Benefits:
 * - Type-safe configuration
 * - Easy to extend with new options
 * - Supports both sync and async configuration
 * - Provides default values
 */
const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<CacheModuleOptions>({
    moduleName: 'CacheModule',
  })
    .setClassMethodName('forRoot')
    .setExtras(
      {
        isGlobal: false,
      },
      (definition, extras) => ({
        ...definition,
        global: extras.isGlobal,
      }),
    )
    .build();

@Module({})
export class CacheModule extends ConfigurableModuleClass {
  static forRoot(options: CacheModuleOptions) {
    return {
      module: CacheModule,
      providers: [
        {
          provide: MODULE_OPTIONS_TOKEN,
          useValue: {
            ttl: options.ttl || 3600,
            maxSize: options.maxSize || 1000,
            strategy: options.strategy || 'lru',
            enabled: options.enabled !== undefined ? options.enabled : true,
          },
        },
        {
          provide: 'CACHE_SERVICE',
          useFactory: (config: CacheModuleOptions) => {
            if (!config.enabled) {
              return {
                get: async () => null,
                set: async () => {},
                delete: async () => {},
              };
            }
            // Implement cache service based on config
            return {
              get: async (key: string) => {
                console.log(`Cache get: ${key} (TTL: ${config.ttl}s)`);
                return null;
              },
              set: async (key: string, value: any) => {
                console.log(`Cache set: ${key} (Strategy: ${config.strategy})`);
              },
              delete: async (key: string) => {
                console.log(`Cache delete: ${key}`);
              },
            };
          },
          inject: [MODULE_OPTIONS_TOKEN],
        },
      ],
      exports: ['CACHE_SERVICE'],
    };
  }
}


import { SetMetadata } from '@nestjs/common';

type MethodDecorator = (
  target: unknown,
  propertyKey: string,
  descriptor: PropertyDescriptor
) => PropertyDescriptor;

interface CacheService {
  get: <T>(key: string) => Promise<T | undefined>;
  set: <T>(key: string, value: T, ttl?: number) => Promise<void>;
}

export interface CacheRefreshOptions {
  key?: string | ((args: unknown[], target: unknown, propertyKey: string) => string);
  ttl?: number;
  condition?: (args: unknown[], target: unknown, propertyKey: string) => boolean;
  namespace?: string;
  background?: boolean; // Refresh in background without waiting
}

export const CACHE_REFRESH_KEY = 'cache:refresh:key';
export const CACHE_REFRESH_OPTIONS = 'cache:refresh:options';

export function CacheRefresh(options: CacheRefreshOptions = {}): MethodDecorator {
  return (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: unknown[]) {
      // Try to get cacheService from the instance
      const cacheService = (this as { cacheService?: CacheService }).cacheService;
      
      // Execute original method first
      const result = await originalMethod.apply(this, args);

      if (!cacheService) {
        return result;
      }

      // Check condition
      if (options.condition && !options.condition(args, target, propertyKey)) {
        return result;
      }

      // Build cache key
      const targetName =
        (target as { constructor?: { name?: string } })?.constructor?.name ?? 'anonymous';
      let cacheKey: string;
      if (typeof options.key === 'function') {
        cacheKey = options.key(args, target, propertyKey);
      } else if (options.key) {
        cacheKey = options.key;
      } else {
        cacheKey = `${targetName}:${propertyKey}:${JSON.stringify(args)}`;
      }

      if (options.namespace) {
        cacheKey = `${options.namespace}:${cacheKey}`;
      }

      // Refresh cache
      if (options.background) {
        // Don't wait for cache refresh
        setImmediate(async () => {
          try {
            await cacheService.set(cacheKey, result, options.ttl);
          } catch (error) {
            console.error('Background cache refresh failed:', error);
          }
        });
      } else {
        await cacheService.set(cacheKey, result, options.ttl);
      }

      return result;
    };

    SetMetadata(CACHE_REFRESH_KEY, options.key)(target as object, propertyKey, descriptor);
    SetMetadata(CACHE_REFRESH_OPTIONS, options)(target as object, propertyKey, descriptor);
    return descriptor;
  };
}

export function CacheRefreshKey(key: string | ((args: unknown[], target: unknown, propertyKey: string) => string)) {
  return SetMetadata(CACHE_REFRESH_KEY, key);
}

export function CacheRefreshTTL(ttl: number) {
  return SetMetadata('cache:refresh:ttl', ttl);
}

export function CacheRefreshCondition(condition: (args: unknown[], target: unknown, propertyKey: string) => boolean) {
  return SetMetadata('cache:refresh:condition', condition);
}

export function CacheRefreshBackground(background: boolean = true) {
  return SetMetadata('cache:refresh:background', background);
}

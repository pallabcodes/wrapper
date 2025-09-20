import { SetMetadata } from '@nestjs/common';

export interface CacheInvalidateOptions {
  key?: string | ((args: any[], target: any, propertyKey: string) => string);
  pattern?: string | ((args: any[], target: any, propertyKey: string) => string);
  tags?: string[];
  namespace?: string;
  condition?: (args: any[], target: any, propertyKey: string) => boolean;
}

export const CACHE_INVALIDATE_KEY = 'cache:invalidate:key';
export const CACHE_INVALIDATE_OPTIONS = 'cache:invalidate:options';

export function CacheInvalidate(options: CacheInvalidateOptions = {}) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      // Try to get cacheService from the instance
      const cacheService = (this as any).cacheService;
      
      // Execute original method first
      const result = await originalMethod.apply(this, args);

      if (!cacheService) {
        return result;
      }

      // Check condition
      if (options.condition && !options.condition(args, target, propertyKey)) {
        return result;
      }

      // Invalidate by key
      if (options.key) {
        let cacheKey: string;
        if (typeof options.key === 'function') {
          cacheKey = options.key(args, target, propertyKey);
        } else {
          cacheKey = options.key;
        }

        if (options.namespace) {
          cacheKey = `${options.namespace}:${cacheKey}`;
        }

        await cacheService.del(cacheKey);
      }

      // Invalidate by pattern
      if (options.pattern) {
        let pattern: string;
        if (typeof options.pattern === 'function') {
          pattern = options.pattern(args, target, propertyKey);
        } else {
          pattern = options.pattern;
        }

        if (options.namespace) {
          pattern = `${options.namespace}:${pattern}`;
        }

        await cacheService.invalidatePattern(pattern);
      }

      // Invalidate by tags (if supported)
      if (options.tags && options.tags.length > 0) {
        for (const tag of options.tags) {
          const tagKey = `tag:${tag}`;
          if (options.namespace) {
            await cacheService.invalidatePattern(`${options.namespace}:${tagKey}:*`);
          } else {
            await cacheService.invalidatePattern(`${tagKey}:*`);
          }
        }
      }

      return result;
    };

    SetMetadata(CACHE_INVALIDATE_KEY, options.key)(target, propertyKey, descriptor);
    SetMetadata(CACHE_INVALIDATE_OPTIONS, options)(target, propertyKey, descriptor);
  };
}

export function CacheInvalidateKey(key: string | ((args: any[], target: any, propertyKey: string) => string)) {
  return SetMetadata(CACHE_INVALIDATE_KEY, key);
}

export function CacheInvalidatePattern(pattern: string | ((args: any[], target: any, propertyKey: string) => string)) {
  return SetMetadata('cache:invalidate:pattern', pattern);
}

export function CacheInvalidateTags(tags: string[]) {
  return SetMetadata('cache:invalidate:tags', tags);
}

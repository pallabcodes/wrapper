import { SetMetadata } from '@nestjs/common';

export interface CacheDecoratorOptions {
  key?: string | ((args: any[], target: any, propertyKey: string) => string);
  ttl?: number;
  condition?: (args: any[], target: any, propertyKey: string) => boolean;
  skipIf?: (result: any) => boolean;
  tags?: string[];
  namespace?: string;
}

export const CACHE_KEY = 'cache:key';
export const CACHE_OPTIONS = 'cache:options';

export function Cache(options: CacheDecoratorOptions = {}) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      // Try to get cacheService from the instance
      const cacheService = (this as any).cacheService;
      if (!cacheService) {
        return originalMethod.apply(this, args);
      }

      // Build cache key
      let cacheKey: string;
      if (typeof options.key === 'function') {
        cacheKey = options.key(args, target, propertyKey);
      } else if (options.key) {
        cacheKey = options.key;
      } else {
        cacheKey = `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;
      }

      // Add namespace if provided
      if (options.namespace) {
        cacheKey = `${options.namespace}:${cacheKey}`;
      }

      // Check condition
      if (options.condition && !options.condition(args, target, propertyKey)) {
        return originalMethod.apply(this, args);
      }

      // Try to get from cache
      const cached = await cacheService.get(cacheKey);
      if (cached !== undefined) {
        return cached;
      }

      // Execute original method
      const result = await originalMethod.apply(this, args);

      // Check skip condition
      if (options.skipIf && options.skipIf(result)) {
        return result;
      }

      // Store in cache
      await cacheService.set(cacheKey, result, options.ttl);

      return result;
    };

    SetMetadata(CACHE_KEY, options.key)(target, propertyKey, descriptor);
    SetMetadata(CACHE_OPTIONS, options)(target, propertyKey, descriptor);
  };
}

export function CacheKey(key: string | ((args: any[], target: any, propertyKey: string) => string)) {
  return SetMetadata(CACHE_KEY, key);
}

export function CacheTTL(ttl: number) {
  return SetMetadata('cache:ttl', ttl);
}

export function CacheCondition(condition: (args: any[], target: any, propertyKey: string) => boolean) {
  return SetMetadata('cache:condition', condition);
}

export function CacheTags(tags: string[]) {
  return SetMetadata('cache:tags', tags);
}

export function CacheNamespace(namespace: string) {
  return SetMetadata('cache:namespace', namespace);
}

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

export interface CacheDecoratorOptions {
  key?: string | ((args: unknown[], target: unknown, propertyKey: string) => string);
  ttl?: number;
  condition?: (args: unknown[], target: unknown, propertyKey: string) => boolean;
  skipIf?: (result: unknown) => boolean;
  tags?: string[];
  namespace?: string;
}

export const CACHE_KEY = 'cache:key';
export const CACHE_OPTIONS = 'cache:options';

export function Cache(options: CacheDecoratorOptions = {}): MethodDecorator {
  return (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: unknown[]) {
      // Try to get cacheService from the instance
      const cacheService = (this as { cacheService?: CacheService }).cacheService;
      if (!cacheService) {
        return originalMethod.apply(this, args);
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

    SetMetadata(CACHE_KEY, options.key)(target as object, propertyKey, descriptor);
    SetMetadata(CACHE_OPTIONS, options)(target as object, propertyKey, descriptor);
    return descriptor;
  };
}

export function CacheKey(key: string | ((args: unknown[], target: unknown, propertyKey: string) => string)) {
  return SetMetadata(CACHE_KEY, key);
}

export function CacheTTL(ttl: number) {
  return SetMetadata('cache:ttl', ttl);
}

export function CacheCondition(condition: (args: unknown[], target: unknown, propertyKey: string) => boolean) {
  return SetMetadata('cache:condition', condition);
}

export function CacheTags(tags: string[]) {
  return SetMetadata('cache:tags', tags);
}

export function CacheNamespace(namespace: string) {
  return SetMetadata('cache:namespace', namespace);
}

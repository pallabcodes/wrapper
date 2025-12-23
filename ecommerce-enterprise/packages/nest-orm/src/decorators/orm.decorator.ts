import { SetMetadata } from '@nestjs/common';
import { ORMProvider, QueryOptimizationOptions } from '../types';

export const ORM_PROVIDER_KEY = 'orm:provider';
export const ORM_OPTIMIZATION_KEY = 'orm:optimization';
export const ORM_CACHE_KEY = 'orm:cache';
export const ORM_TIMEOUT_KEY = 'orm:timeout';

/**
 * Decorator to specify ORM provider for a method
 */
export const UseProvider = (provider: ORMProvider) => SetMetadata(ORM_PROVIDER_KEY, provider);

/**
 * Decorator to specify query optimization options
 */
export const Optimize = (options: QueryOptimizationOptions) => SetMetadata(ORM_OPTIMIZATION_KEY, options);

/**
 * Decorator to enable caching for a method
 */
export const Cache = (ttl?: number) => SetMetadata(ORM_CACHE_KEY, { enabled: true, ttl });

/**
 * Decorator to disable caching for a method
 */
export const NoCache = () => SetMetadata(ORM_CACHE_KEY, { enabled: false });

/**
 * Decorator to set query timeout
 */
export const Timeout = (timeout: number) => SetMetadata(ORM_TIMEOUT_KEY, timeout);

/**
 * Decorator to enable query batching
 */
export const Batch = (size?: number) => SetMetadata(ORM_OPTIMIZATION_KEY, { 
  useBatching: true, 
  batchSize: size 
});

/**
 * Decorator to set query priority
 */
export const Priority = (priority: number) => SetMetadata(ORM_OPTIMIZATION_KEY, { 
  priority 
});

/**
 * Decorator to enable query analysis
 */
export const Analyze = () => SetMetadata(ORM_OPTIMIZATION_KEY, { 
  analyze: true 
});

import { SetMetadata } from '@nestjs/common';

export const QUERY_CACHE_KEY = 'query_cache';

export interface QueryCacheOptions {
  ttl?: number;
  key?: string;
  tags?: string[];
  refresh?: boolean;
}

export const QueryCache = (options?: QueryCacheOptions) => SetMetadata(QUERY_CACHE_KEY, options || {});


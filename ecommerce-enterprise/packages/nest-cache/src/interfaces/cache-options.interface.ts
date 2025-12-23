export interface CacheOptions {
  global?: boolean;
  ttl?: number;
  maxSize?: number;
  redis?: {
    enabled: boolean;
    cluster?: {
      nodes: string[];
      options?: any;
    };
    single?: {
      host: string;
      port: number;
      password?: string;
      db?: number;
    };
    keyPrefix?: string;
    retryDelayOnFailover?: number;
    maxRetriesPerRequest?: number;
  };
  memory?: {
    enabled: boolean;
    maxSize?: number;
    ttl?: number;
    updateAgeOnGet?: boolean;
    allowStale?: boolean;
  };
  compression?: {
    enabled: boolean;
    algorithm?: 'gzip' | 'deflate' | 'brotli';
    threshold?: number; // Only compress if size > threshold
    level?: number; // Compression level 1-9
  };
  encryption?: {
    enabled: boolean;
    algorithm?: string;
    key: string;
    iv?: string;
  };
  metrics?: {
    enabled: boolean;
    prefix?: string;
  };
  invalidation?: {
    enabled: boolean;
    pattern?: string;
    broadcast?: boolean;
  };
}

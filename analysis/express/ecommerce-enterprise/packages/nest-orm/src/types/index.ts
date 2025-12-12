export * from '../interfaces/orm-options.interface';

export interface DatabaseQuery<_T = unknown> {
  /** Query type */
  type: 'select' | 'insert' | 'update' | 'delete' | 'raw';
  
  /** Table/Model name */
  table: string;
  
  /** Query conditions */
  where?: Record<string, unknown>;
  
  /** Query data for insert/update */
  data?: Record<string, unknown> | Record<string, unknown>[];
  
  /** Query options */
  options?: QueryOptimizationOptions;
  
  /** Raw SQL query (for raw queries) */
  sql?: string;
  
  /** Query parameters (for raw queries) */
  params?: unknown[];
  
  /** Pagination */
  pagination?: {
    page: number;
    limit: number;
    offset?: number;
  };
  
  /** Sorting */
  orderBy?: {
    [key: string]: 'asc' | 'desc';
  };
  
  /** Field selection */
  select?: string[];
  
  /** Relations to include */
  include?: string[];
  
  /** Group by fields */
  groupBy?: string[];
  
  /** Having conditions */
  having?: Record<string, unknown>;
}

export interface QueryOptimizationOptions {
  /** Use caching for this query */
  useCache?: boolean;
  /** Cache TTL override */
  cacheTtl?: number;
  /** Use batching for this query */
  useBatching?: boolean;
  /** Query priority (higher = more important) */
  priority?: number;
  /** Query timeout override */
  timeout?: number;
}

export interface QueryResult<T = unknown> {
  /** Query results */
  data: T[];
  
  /** Total count (for paginated queries) */
  total?: number;
  
  /** Pagination info */
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  
  /** Query execution time in milliseconds */
  executionTime: number;
  
  /** ORM provider used */
  provider: ORMProvider;
  
  /** Query metadata */
  metadata?: {
    cached?: boolean;
    batched?: boolean;
    optimized?: boolean;
  };
}

export interface TransactionOptions {
  /** Transaction timeout in milliseconds */
  timeout?: number;
  
  /** Isolation level */
  isolationLevel?: 'read-uncommitted' | 'read-committed' | 'repeatable-read' | 'serializable';
  
  /** Retry on deadlock */
  retryOnDeadlock?: boolean;
  
  /** Maximum retry attempts */
  maxRetries?: number;
}

export interface TransactionResult<T = unknown> {
  /** Transaction results */
  data: T;
  
  /** Transaction execution time */
  executionTime: number;
  
  /** ORM provider used */
  provider: ORMProvider;
  
  /** Transaction metadata */
  metadata?: {
    retries?: number;
    rolledBack?: boolean;
  };
}

export type ORMProvider = 'prisma' | 'drizzle' | 'typeorm';

export interface PerformanceMetrics {
  /** Total queries executed */
  totalQueries: number;
  
  /** Average query execution time */
  averageExecutionTime: number;
  
  /** Slow queries count */
  slowQueries: number;
  
  /** Cache hit rate */
  cacheHitRate: number;
  
  /** Error rate */
  errorRate: number;
  
  /** Provider usage statistics */
  providerUsage: {
    [key in ORMProvider]: {
      queries: number;
      averageTime: number;
      errors: number;
    };
  };
}

export interface QueryAnalysis {
  /** Query complexity score */
  complexity: number;
  
  /** Recommended optimizations */
  optimizations: string[];
  
  /** Performance score */
  performanceScore: number;
  
  /** Index recommendations */
  indexRecommendations: string[];
  
  /** Query pattern analysis */
  patterns: {
    type: string;
    frequency: number;
    averageTime: number;
  }[];
}

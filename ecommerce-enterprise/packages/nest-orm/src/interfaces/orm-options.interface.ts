// Types are defined in this file; avoid circular imports

export interface ORMOptions {
  /** Primary ORM provider to use */
  primary: ORMProvider;
  
  /** Fallback ORM providers in order of preference */
  fallbacks?: ORMProvider[];
  
  /** Connection configuration for each provider */
  connections: {
    prisma?: PrismaConnectionConfig;
    drizzle?: DrizzleConnectionConfig;
    typeorm?: TypeOrmConnectionConfig;
  };
  
  /** Query optimization settings */
  optimization?: {
    /** Enable query caching */
    caching?: boolean;
    /** Cache TTL in seconds */
    cacheTtl?: number;
    /** Enable query batching */
    batching?: boolean;
    /** Batch size for queries */
    batchSize?: number;
    /** Enable query analysis */
    analysis?: boolean;
  };
  
  /** Performance monitoring */
  monitoring?: {
    /** Enable query performance tracking */
    performanceTracking?: boolean;
    /** Slow query threshold in milliseconds */
    slowQueryThreshold?: number;
    /** Enable query logging */
    queryLogging?: boolean;
  };
  
  /** Transaction settings */
  transactions?: {
    /** Default transaction timeout in milliseconds */
    timeout?: number;
    /** Enable automatic retry on deadlock */
    retryOnDeadlock?: boolean;
    /** Maximum retry attempts */
    maxRetries?: number;
  };
}

export type ORMProvider = 'prisma' | 'drizzle' | 'typeorm';

export interface PrismaConnectionConfig {
  url: string;
  maxConnections?: number;
  connectionTimeout?: number;
  queryTimeout?: number;
}

export interface DrizzleConnectionConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  maxConnections?: number;
  connectionTimeout?: number;
  queryTimeout?: number;
}

export interface TypeOrmConnectionConfig {
  type: 'postgres' | 'mysql' | 'sqlite' | 'mariadb' | 'oracle';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  maxConnections?: number;
  connectionTimeout?: number;
  queryTimeout?: number;
  synchronize?: boolean;
  logging?: boolean;
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

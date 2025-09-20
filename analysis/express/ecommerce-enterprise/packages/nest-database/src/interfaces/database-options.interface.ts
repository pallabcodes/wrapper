export interface DatabaseOptions {
  type: 'postgres' | 'mysql' | 'sqlite' | 'better-sqlite3';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  synchronize?: boolean;
  logging?: boolean;
  entities?: string[];
  migrations?: string[];
  subscribers?: string[];
  ssl?: boolean | object;
  poolSize?: number;
  maxQueryExecutionTime?: number;
  cache?: {
    enabled: boolean;
    ttl?: number;
    maxSize?: number;
  };
  monitoring?: {
    enabled: boolean;
    slowQueryThreshold?: number;
    metricsEnabled?: boolean;
  };
  healthCheck?: boolean;
}

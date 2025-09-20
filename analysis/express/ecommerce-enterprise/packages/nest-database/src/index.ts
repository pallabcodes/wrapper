export * from './database.module';
export * from './database.service';
export * from './interfaces/database-options.interface';
export * from './utils/connection-pool';
export * from './utils/query-optimizer';
export * from './decorators';
export * from './interceptors';
export * from './guards';
export * from './controllers';

// Export specific classes to avoid conflicts
export { QueryCache } from './utils/query-cache';
export { QueryProfile, QueryProfiler } from './monitoring/query-profiler';
export { DatabaseMetrics } from './monitoring/database-metrics';
export { HealthChecker } from './monitoring/health-checker';
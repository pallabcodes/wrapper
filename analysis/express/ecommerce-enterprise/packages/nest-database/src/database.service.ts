import { Injectable, Logger } from '@nestjs/common';
import { DataSource, Repository, EntityTarget, ObjectLiteral } from 'typeorm';
import { ConnectionPool } from './utils/connection-pool';
import { QueryCache } from './utils/query-cache';
import { QueryOptimizer } from './utils/query-optimizer';
import { DatabaseMetrics } from './monitoring/database-metrics';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly connectionPool: ConnectionPool,
    private readonly queryCache: QueryCache,
    private readonly queryOptimizer: QueryOptimizer,
    private readonly metrics: DatabaseMetrics,
  ) {}

  getRepository<T extends ObjectLiteral>(entity: EntityTarget<T>): Repository<T> {
    return this.dataSource.getRepository(entity);
  }

  async query<T = any>(sql: string, parameters?: any[]): Promise<T[]> {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cacheKey = this.queryCache.generateKey(sql, parameters);
      const cached = await this.queryCache.get(cacheKey);
      if (cached) {
        this.metrics.recordCacheHit();
        return cached;
      }

      // Optimize query
      const optimizedSql = this.queryOptimizer.optimize(sql);
      
      // Execute query
      const result = await this.dataSource.query(optimizedSql, parameters);
      
      // Cache result
      await this.queryCache.set(cacheKey, result);
      
      const duration = Date.now() - startTime;
      this.metrics.recordQuery('SELECT', 'unknown', duration);
      
      return result;
    } catch (error) {
      this.metrics.recordError('SELECT', 'unknown');
      this.logger.error(`Query failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async transaction<T>(fn: (manager: any) => Promise<T>): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await this.dataSource.transaction(fn);
      
      const duration = Date.now() - startTime;
      this.metrics.recordTransaction('success', duration);
      
      return result;
    } catch (error) {
      this.metrics.recordError('TRANSACTION', 'unknown');
      this.logger.error(`Transaction failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async getConnectionStats(): Promise<any> {
    return this.connectionPool.getStats();
  }

  async getQueryStats(): Promise<any> {
    return this.queryCache.getStats();
  }

  async getMetrics(): Promise<any> {
    return this.metrics.getMetrics();
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch (error) {
      this.logger.error(`Health check failed: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
}

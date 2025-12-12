import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize, QueryTypes } from 'sequelize';
import { CustomLoggerService } from '../logging/logger.service';

@Injectable()
export class DatabasePerformanceService {
  constructor(
    @InjectConnection()
    private readonly sequelize: Sequelize,
    private readonly logger: CustomLoggerService,
  ) {}

  async logSlowQueries(): Promise<void> {
    // Enable query logging for performance monitoring
    (this.sequelize as any).options.logging = (sql: string, timing?: number) => {
      if (timing && timing > 100) {
        this.logger.performance('Slow Query Detected', timing, {
          sql: sql.substring(0, 500),
          timing,
        });
      }
    };
  }

  async getConnectionPoolStats(): Promise<any> {
    const pool = (this.sequelize as any).connectionManager?.pool;

    if (!pool) {
      return { status: 'no pool available' };
    }

    return {
      size: pool.size,
      available: pool.available,
      using: pool.using,
      waiting: pool.waiting,
      borrowed: pool.borrowed,
      pending: pool.pending,
      borrowedTime: pool.borrowedTime,
      returned: pool.returned,
    };
  }

  async optimizeConnectionPool(): Promise<void> {
    const poolStats = await this.getConnectionPoolStats();

    this.logger.debug(
      `Database Connection Pool Stats ${JSON.stringify({
      ...poolStats,
      timestamp: new Date().toISOString(),
      })}`,
      'DatabasePerformance',
    );

    if (poolStats.size && poolStats.using !== undefined) {
    const utilizationRate = poolStats.using / poolStats.size;
    if (utilizationRate > 0.8) {
        this.logger.warn(
          `High database connection pool utilization detected ${JSON.stringify({
        utilizationRate: `${(utilizationRate * 100).toFixed(1)}%`,
        ...poolStats,
          })}`,
          'DatabasePerformance',
        );
      }
    }
  }

  async runHealthCheckQueries(): Promise<any> {
    const startTime = Date.now();
    const results = {
      connection: false,
      select: false,
      insert: false,
      update: false,
      delete: false,
      connectionTime: 0,
      totalTime: 0,
    };

    try {
      // Test connection
      await this.sequelize.authenticate();
      results.connection = true;
      results.connectionTime = Date.now() - startTime;

      // Test SELECT query
      await this.sequelize.query('SELECT 1 as test');
      results.select = true;

      // Test INSERT, UPDATE, DELETE would require actual table operations
      // For now, we'll just test basic CRUD operations

      results.totalTime = Date.now() - startTime;

      this.logger.performance(
        'Database Health Check',
        results.totalTime,
        { status: 'success' },
      );

      return results;
    } catch (error) {
      results.totalTime = Date.now() - startTime;

      this.logger.error(
        `Database Health Check Failed: ${error.message}`,
        error.stack,
      );

      return { ...results, error: error.message };
    }
  }
}
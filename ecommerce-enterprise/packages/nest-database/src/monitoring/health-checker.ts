import { Injectable, Logger } from '@nestjs/common';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  details: {
    database: boolean;
    connectionPool: boolean;
    queryCache: boolean;
    lastCheck: Date;
  };
  metrics: {
    activeConnections: number;
    idleConnections: number;
    totalQueries: number;
    errorRate: number;
  };
}

@Injectable()
export class HealthChecker {
  private readonly logger = new Logger(HealthChecker.name);
  private lastHealthCheck: Date = new Date();
  private healthStatus: HealthStatus | null = null;

  constructor(
    private readonly databaseService: any, // DatabaseService
    private readonly connectionPool: any, // ConnectionPool
    private readonly queryCache: any, // QueryCache
    private readonly databaseMetrics: any, // DatabaseMetrics
  ) {}

  async checkHealth(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      // Check database connectivity
      const databaseHealthy = await this.checkDatabaseConnectivity();
      
      // Check connection pool
      const connectionPoolHealthy = await this.checkConnectionPool();
      
      // Check query cache
      const queryCacheHealthy = await this.checkQueryCache();
      
      // Calculate overall status
      const healthyCount = [databaseHealthy, connectionPoolHealthy, queryCacheHealthy].filter(Boolean).length;
      let status: 'healthy' | 'unhealthy' | 'degraded';
      
      if (healthyCount === 3) {
        status = 'healthy';
      } else if (healthyCount >= 1) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }

      // Get metrics
      const metrics = await this.getMetrics();

      this.healthStatus = {
        status,
        details: {
          database: databaseHealthy,
          connectionPool: connectionPoolHealthy,
          queryCache: queryCacheHealthy,
          lastCheck: new Date(),
        },
        metrics,
      };

      this.lastHealthCheck = new Date();
      
      const duration = Date.now() - startTime;
      this.logger.debug(`Health check completed in ${duration}ms`, { status });

      return this.healthStatus;
    } catch (error) {
      this.logger.error('Health check failed', error);
      
      this.healthStatus = {
        status: 'unhealthy',
        details: {
          database: false,
          connectionPool: false,
          queryCache: false,
          lastCheck: new Date(),
        },
        metrics: {
          activeConnections: 0,
          idleConnections: 0,
          totalQueries: 0,
          errorRate: 1.0,
        },
      };

      return this.healthStatus;
    }
  }

  private async checkDatabaseConnectivity(): Promise<boolean> {
    try {
      await this.databaseService.query('SELECT 1');
      return true;
    } catch (error) {
      this.logger.error('Database connectivity check failed', error);
      return false;
    }
  }

  private async checkConnectionPool(): Promise<boolean> {
    try {
      const pool = this.connectionPool.getPool();
      return pool && pool.totalCount > 0;
    } catch (error) {
      this.logger.error('Connection pool check failed', error);
      return false;
    }
  }

  private async checkQueryCache(): Promise<boolean> {
    try {
      // Simple cache health check
      await this.queryCache.get('health-check');
      return true;
    } catch (error) {
      this.logger.error('Query cache check failed', error);
      return false;
    }
  }

  private async getMetrics(): Promise<HealthStatus['metrics']> {
    try {
      const pool = this.connectionPool.getPool();
      const totalQueries = this.databaseMetrics.queryCounter?.get()?.values?.[0]?.value || 0;
      const totalErrors = this.databaseMetrics.errorCounter?.get()?.values?.[0]?.value || 0;
      const errorRate = totalQueries > 0 ? totalErrors / totalQueries : 0;

      return {
        activeConnections: pool?.usedCount || 0,
        idleConnections: pool?.idleCount || 0,
        totalQueries,
        errorRate,
      };
    } catch (error) {
      this.logger.error('Failed to get metrics', error);
      return {
        activeConnections: 0,
        idleConnections: 0,
        totalQueries: 0,
        errorRate: 0,
      };
    }
  }

  getLastHealthStatus(): HealthStatus | null {
    return this.healthStatus;
  }

  getLastHealthCheck(): Date {
    return this.lastHealthCheck;
  }
}


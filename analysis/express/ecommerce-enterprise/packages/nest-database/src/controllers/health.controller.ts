import { Controller, Get, Logger } from '@nestjs/common';
import { HealthChecker } from '../monitoring/health-checker';

@Controller('database/health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly healthChecker: HealthChecker) {}

  @Get()
  async getHealth() {
    try {
      const health = await this.healthChecker.checkHealth();
      return {
        status: health.status,
        details: health.details,
        metrics: health.metrics,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Health check failed', error);
      return {
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
        timestamp: new Date().toISOString(),
        error: (error as Error).message,
      };
    }
  }

  @Get('metrics')
  async getMetrics() {
    try {
      const health = await this.healthChecker.checkHealth();
      return {
        metrics: health.metrics,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Metrics retrieval failed', error);
      return {
        metrics: {
          activeConnections: 0,
          idleConnections: 0,
          totalQueries: 0,
          errorRate: 1.0,
        },
        timestamp: new Date().toISOString(),
        error: (error as Error).message,
      };
    }
  }
}


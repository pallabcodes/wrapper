import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';

export interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  database: {
    status: 'ok' | 'error';
    latency?: number;
    error?: string;
  };
  services: {
    [key: string]: {
      status: 'ok' | 'error';
      latency?: number;
      error?: string;
    };
  };
}

@Injectable()
export class HealthService {
  private startTime: number;

  constructor(
    @InjectConnection()
    private readonly sequelize: Sequelize,
  ) {
    this.startTime = Date.now();
  }

  async getHealth(): Promise<HealthStatus> {
    const timestamp = new Date().toISOString();
    const uptime = Date.now() - this.startTime;

    // Memory usage
    const memUsage = process.memoryUsage();
    const memory = {
      used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
    };

    // Database health check
    const dbHealth = await this.checkDatabaseHealth();

    // Service health checks
    const services = {
      database: dbHealth,
    };

    // Overall status
    const hasErrors = Object.values(services).some(service => service.status === 'error');
    const status = hasErrors ? 'error' : 'ok';

    return {
      status,
      timestamp,
      uptime,
      memory,
      database: dbHealth,
      services,
    };
  }

  private async checkDatabaseHealth(): Promise<{ status: 'ok' | 'error'; latency?: number; error?: string }> {
    const startTime = Date.now();

    try {
      await this.sequelize.authenticate();
      const latency = Date.now() - startTime;

      return {
        status: 'ok',
        latency,
      };
    } catch (error) {
      return {
        status: 'error',
        latency: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  async getMetrics(): Promise<any> {
    const health = await this.getHealth();

    return {
      application: {
        uptime: health.uptime,
        memory_usage_percentage: health.memory.percentage,
        status: health.status,
      },
      database: {
        status: health.database.status,
        latency_ms: health.database.latency,
      },
      timestamp: health.timestamp,
    };
  }
}

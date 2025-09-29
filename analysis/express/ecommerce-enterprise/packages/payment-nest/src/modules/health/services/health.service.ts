import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthService {
  constructor(private readonly configService: ConfigService) {}

  async getHealth(): Promise<any> {
    const startTime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(startTime),
      version: '1.0.0',
      environment: this.configService.get('NODE_ENV', 'development'),
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
      },
      services: {
        database: await this.checkDatabaseHealth(),
        redis: await this.checkRedisHealth(),
        paymentProviders: await this.checkPaymentProvidersHealth(),
      },
    };
  }

  async getReadiness(): Promise<any> {
    const checks = await Promise.allSettled([
      this.checkDatabaseHealth(),
      this.checkRedisHealth(),
      this.checkPaymentProvidersHealth(),
    ]);

    const allHealthy = checks.every(check => 
      check.status === 'fulfilled' && check.value.status === 'healthy'
    );

    if (allHealthy) {
      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks: checks.map(check => 
          check.status === 'fulfilled' ? check.value : { status: 'unhealthy', error: check.reason }
        ),
      };
    }

    return {
      status: 'not ready',
      timestamp: new Date().toISOString(),
      checks: checks.map(check => 
        check.status === 'fulfilled' ? check.value : { status: 'unhealthy', error: check.reason }
      ),
    };
  }

  async getLiveness(): Promise<any> {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    };
  }

  private async checkDatabaseHealth(): Promise<{ status: string; details?: Record<string, unknown> }> {
    try {
      // This would typically involve a database ping
      // For now, we'll simulate a healthy database
      return {
        status: 'healthy',
        details: {
          connection: 'active',
          responseTime: '5ms',
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: (error as Error).message,
        },
      };
    }
  }

  private async checkRedisHealth(): Promise<{ status: string; details?: Record<string, unknown> }> {
    try {
      // This would typically involve a Redis ping
      // For now, we'll simulate a healthy Redis
      return {
        status: 'healthy',
        details: {
          connection: 'active',
          responseTime: '2ms',
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: (error as Error).message,
        },
      };
    }
  }

  private async checkPaymentProvidersHealth(): Promise<{ status: string; details?: Record<string, unknown> }> {
    try {
      // This would typically involve checking payment provider APIs
      // For now, we'll simulate healthy providers
      return {
        status: 'healthy',
        details: {
          stripe: 'active',
          braintree: 'active',
          paypal: 'active',
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: (error as Error).message,
        },
      };
    }
  }
}

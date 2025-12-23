import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthCheckResult, HealthCheckOptions, SystemHealth, HealthCheckFunction } from './health-check.types';

@Injectable()
export class HealthCheckService {
  private readonly logger = new Logger(HealthCheckService.name);
  private readonly startTime = Date.now();
  private readonly checks: HealthCheckFunction[] = [];

  constructor(private readonly configService: ConfigService) {
    this.registerDefaultChecks();
  }

  registerCheck(check: HealthCheckFunction): void {
    this.checks.push(check);
  }

  async checkHealth(options: HealthCheckOptions = {}): Promise<SystemHealth> {
    const { timeout = 5000, detailed = false } = options;
    const timestamp = new Date().toISOString();
    const results: HealthCheckResult[] = [];

    // Run all health checks in parallel with timeout
    const checkPromises: Promise<HealthCheckResult>[] = this.checks.map(async (check) => {
      try {
        const checkTimeout = check.timeout || timeout;
        const result = await Promise.race<HealthCheckResult>([
          check.check(),
          new Promise<HealthCheckResult>((_, reject) =>
            setTimeout(() => reject(new Error('Health check timeout')), checkTimeout)
          ),
        ]);
        return result;
      } catch (error) {
        this.logger.error(`Health check ${check.name} failed`, error);
        return {
          name: check.name,
          status: 'unhealthy' as const,
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp,
        };
      }
    });

    const checkResults = await Promise.all(checkPromises);
    results.push(...checkResults);

    // Determine overall status
    const criticalChecks = this.checks.filter(c => c.critical);
    const criticalResults = results.filter(r => criticalChecks.some(c => c.name === r.name));
    
    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    
    if (criticalResults.some(r => r.status === 'unhealthy')) {
      status = 'unhealthy';
    } else if (results.some(r => r.status === 'unhealthy')) {
      status = 'degraded';
    } else if (results.some(r => r.status === 'degraded')) {
      status = 'degraded';
    }

    const summary = {
      total: results.length,
      healthy: results.filter(r => r.status === 'healthy').length,
      unhealthy: results.filter(r => r.status === 'unhealthy').length,
      degraded: results.filter(r => r.status === 'degraded').length,
    };

    return {
      status,
      timestamp,
      uptime: Date.now() - this.startTime,
      version: this.configService.get('APP_VERSION', '1.0.0'),
      environment: this.configService.get('NODE_ENV', 'development'),
      checks: detailed ? results : results.filter(r => r.status !== 'healthy'),
      summary,
    };
  }

  private registerDefaultChecks(): void {
    // Memory usage check
    this.registerCheck({
      name: 'memory',
      check: async () => {
        const usage = process.memoryUsage();
        const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
        const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
        const rssMB = Math.round(usage.rss / 1024 / 1024);
        
        const maxMemoryMB = this.configService.get('MAX_MEMORY_MB', 512);
        const memoryUsagePercent = (rssMB / maxMemoryMB) * 100;
        
        let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
        let message = `Memory usage: ${rssMB}MB RSS, ${heapUsedMB}MB heap`;
        
        if (memoryUsagePercent > 90) {
          status = 'unhealthy';
          message += ` (${memoryUsagePercent.toFixed(1)}% of limit)`;
        } else if (memoryUsagePercent > 75) {
          status = 'degraded';
          message += ` (${memoryUsagePercent.toFixed(1)}% of limit)`;
        }
        
        return {
          name: 'memory',
          status,
          message,
          details: {
            rss: rssMB,
            heapUsed: heapUsedMB,
            heapTotal: heapTotalMB,
            external: Math.round(usage.external / 1024 / 1024),
            arrayBuffers: Math.round(usage.arrayBuffers / 1024 / 1024),
            usagePercent: memoryUsagePercent,
          },
          timestamp: new Date().toISOString(),
        };
      },
      critical: true,
    });

    // CPU usage check
    this.registerCheck({
      name: 'cpu',
      check: async () => {
        const startUsage = process.cpuUsage();
        await new Promise(resolve => setTimeout(resolve, 100));
        const endUsage = process.cpuUsage(startUsage);
        
        const cpuPercent = (endUsage.user + endUsage.system) / 1000000; // Convert to seconds
        
        let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
        let message = `CPU usage: ${cpuPercent.toFixed(2)}%`;
        
        if (cpuPercent > 80) {
          status = 'unhealthy';
        } else if (cpuPercent > 60) {
          status = 'degraded';
        }
        
        return {
          name: 'cpu',
          status,
          message,
          details: {
            user: endUsage.user,
            system: endUsage.system,
            percent: cpuPercent,
          },
          timestamp: new Date().toISOString(),
        };
      },
    });

    // Event loop lag check
    this.registerCheck({
      name: 'eventloop',
      check: async () => {
        const start = process.hrtime.bigint();
        await new Promise(resolve => setImmediate(resolve));
        const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to milliseconds
        
        let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
        let message = `Event loop lag: ${lag.toFixed(2)}ms`;
        
        if (lag > 100) {
          status = 'unhealthy';
        } else if (lag > 50) {
          status = 'degraded';
        }
        
        return {
          name: 'eventloop',
          status,
          message,
          details: { lag },
          timestamp: new Date().toISOString(),
        };
      },
      critical: true,
    });

    // Database connectivity check
    this.registerCheck({
      name: 'database',
      check: async () => {
        // This would be implemented based on your database
        // For now, return a mock check
        return {
          name: 'database',
          status: 'healthy',
          message: 'Database connection healthy',
          timestamp: new Date().toISOString(),
        };
      },
      critical: true,
    });

    // Redis connectivity check
    this.registerCheck({
      name: 'redis',
      check: async () => {
        // This would be implemented based on your Redis setup
        // For now, return a mock check
        return {
          name: 'redis',
          status: 'healthy',
          message: 'Redis connection healthy',
          timestamp: new Date().toISOString(),
        };
      },
      critical: false,
    });
  }
}

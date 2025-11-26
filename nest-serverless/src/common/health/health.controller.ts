import {
  Controller,
  Get,
  HttpStatus,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  HealthCheckService,
  HealthIndicatorResult,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  async check() {
    try {
      const result = await this.health.check([
        // Memory health check
        () =>
          this.memory.checkHeap('memory_heap', 150 * 1024 * 1024), // 150MB

        // Disk health check (Lambda has limited disk)
        () =>
          this.disk.checkStorage('storage', {
            path: '/tmp',
            thresholdPercent: 0.9,
          }),
      ]);

      this.logger.log('Health check passed', result);
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        ...result,
      };
    } catch (error) {
      this.logger.error('Health check failed', error);
      throw new ServiceUnavailableException({
        status: 'error',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        error: error.message,
      });
    }
  }

  @Get('ready')
  async readiness() {
    return this.check();
  }

  @Get('live')
  async liveness() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('metrics')
  async metrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      version: process.version,
      platform: process.platform,
      arch: process.arch,
      lambda: {
        functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
        functionVersion: process.env.AWS_LAMBDA_FUNCTION_VERSION,
        requestId: process.env.AWS_REQUEST_ID,
      },
    };
  }
}





import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck, MemoryHealthIndicator, DiskHealthIndicator } from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Service Health Check',
    description: 'Comprehensive health check for Auth Service'
  })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024), // 150MB
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024), // 150MB
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          thresholdPercent: 0.9, // 90%
        }),
    ]);
  }

  @Get('ready')
  @ApiOperation({
    summary: 'Readiness Check',
    description: 'Check if service is ready to accept traffic'
  })
  @HealthCheck()
  readiness() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024), // 200MB
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          thresholdPercent: 0.95, // 95%
        }),
    ]);
  }

  @Get('live')
  @ApiOperation({
    summary: 'Liveness Check',
    description: 'Check if service is alive and responding'
  })
  liveness() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'auth-service',
      version: '1.0.0',
    };
  }
}

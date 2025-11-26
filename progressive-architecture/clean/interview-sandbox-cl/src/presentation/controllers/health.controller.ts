import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService, HealthStatus } from '../../infrastructure/monitoring/health.service';
import { CacheService } from '../../infrastructure/cache/cache.service';

@ApiTags('Health & Monitoring')
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly cacheService: CacheService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get application health status',
    description: 'Returns comprehensive health status including database connectivity, memory usage, and service status'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Application is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        timestamp: { type: 'string', format: 'date-time' },
        uptime: { type: 'number', description: 'Uptime in milliseconds' },
        memory: {
          type: 'object',
          properties: {
            used: { type: 'number', description: 'Used memory in MB' },
            total: { type: 'number', description: 'Total memory in MB' },
            percentage: { type: 'number', description: 'Memory usage percentage' },
          },
        },
        database: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ok', 'error'] },
            latency: { type: 'number', description: 'Database response time in ms' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'Application is unhealthy',
  })
  async getHealth(): Promise<HealthStatus> {
    return this.healthService.getHealth();
  }

  @Get('metrics')
  @ApiOperation({
    summary: 'Get application metrics',
    description: 'Returns key performance metrics for monitoring systems'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Metrics retrieved successfully',
  })
  async getMetrics(): Promise<any> {
    return this.healthService.getMetrics();
  }

  @Get('ping')
  @ApiOperation({
    summary: 'Simple ping endpoint',
    description: 'Basic connectivity check that always returns OK'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service is responding',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  async ping(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('cache')
  @ApiOperation({
    summary: 'Get cache statistics',
    description: 'Returns cache performance metrics and statistics'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cache statistics retrieved successfully',
  })
  async getCacheStats(): Promise<any> {
    return this.cacheService.getStats();
  }
}

import { Controller, Get } from '@nestjs/common';

/**
 * Presentation Layer: Health Controller
 *
 * Provides health check endpoints for monitoring and Kubernetes probes
 * Follows Clean Architecture by being in the presentation layer
 */
interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
  service: string;
  version: string;
  environment: string;
}

@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();
  private readonly serviceInfo = {
    service: 'user-service',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  };

  /**
   * Overall health check
   * GET /health
   */
  @Get()
  check(): HealthResponse {
    return this.buildResponse('ok');
  }

  /**
   * Liveness probe for Kubernetes
   * GET /health/live
   */
  @Get('live')
  liveness(): HealthResponse {
    return this.buildResponse('alive');
  }

  /**
   * Readiness probe for Kubernetes
   * GET /health/ready
   */
  @Get('ready')
  readiness(): HealthResponse {
    // In a real implementation, this would check:
    // - Database connectivity
    // - External service availability
    // - Message queue connectivity
    return this.buildResponse('ready');
  }

  private buildResponse(status: string): HealthResponse {
    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      ...this.serviceInfo
    };
  }
}

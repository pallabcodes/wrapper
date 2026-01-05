import { Controller, Get } from '@nestjs/common';

/**
 * Presentation Layer: Health Controller
 *
 * Provides health check endpoints for monitoring and load balancer health checks
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
    service: 'notification-service',
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
    // In production, check database connectivity, email/SMS providers, etc.
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

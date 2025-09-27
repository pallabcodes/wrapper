import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ZOD_PERFORMANCE_METADATA, ZodPerformanceOptions } from '../interfaces/zod-validation.interface';

@Injectable()
export class ZodPerformanceGuard implements CanActivate {
  private readonly logger = new Logger(ZodPerformanceGuard.name);
  private readonly requestMetrics = new Map<string, {
    startTime: number;
    requestCount: number;
    lastRequestTime: number;
  }>();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();

    const performanceOptions = this.reflector.get<ZodPerformanceOptions>(
      ZOD_PERFORMANCE_METADATA,
      handler,
    );

    if (!performanceOptions) {
      return true; // No performance requirements
    }

    const requestId = this.getRequestId(request);
    const now = Date.now();

    // Check concurrent validation limits
    if (performanceOptions.maxConcurrentValidations) {
      if (!this.checkConcurrentValidationLimit(performanceOptions.maxConcurrentValidations)) {
        this.logger.warn(`Concurrent validation limit exceeded: ${performanceOptions.maxConcurrentValidations}`);
        return false;
      }
    }

    // Check rate limiting
    if (this.isRateLimited(requestId, performanceOptions, now)) {
      this.logger.warn(`Rate limit exceeded for request: ${requestId}`);
      return false;
    }

    // Record request metrics
    this.recordRequestMetrics(requestId, now);

    // Apply performance optimizations
    this.applyPerformanceOptimizations(request, performanceOptions);

    return true;
  }

  private getRequestId(request: any): string {
    return request.headers['x-request-id'] || 
           request.headers['x-correlation-id'] || 
           `${request.ip}-${Date.now()}`;
  }

  private checkConcurrentValidationLimit(maxConcurrent: number): boolean {
    const activeValidations = Array.from(this.requestMetrics.values())
      .filter(metrics => Date.now() - metrics.lastRequestTime < 30000) // 30 second window
      .length;

    return activeValidations < maxConcurrent;
  }

  private isRateLimited(requestId: string, _options: ZodPerformanceOptions, now: number): boolean {
    const metrics = this.requestMetrics.get(requestId);
    
    if (!metrics) {
      return false;
    }

    // Simple rate limiting based on request count and time window
    const timeWindow = 60000; // 1 minute
    const maxRequests = 100; // Default max requests per minute

    if (now - metrics.startTime > timeWindow) {
      // Reset window
      metrics.startTime = now;
      metrics.requestCount = 1;
      return false;
    }

    if (metrics.requestCount >= maxRequests) {
      return true;
    }

    return false;
  }

  private recordRequestMetrics(requestId: string, now: number): void {
    const existing = this.requestMetrics.get(requestId);
    
    if (existing) {
      existing.requestCount++;
      existing.lastRequestTime = now;
    } else {
      this.requestMetrics.set(requestId, {
        startTime: now,
        requestCount: 1,
        lastRequestTime: now,
      });
    }

    // Clean up old metrics
    this.cleanupOldMetrics(now);
  }

  private cleanupOldMetrics(now: number): void {
    const maxAge = 300000; // 5 minutes
    
    for (const [requestId, metrics] of this.requestMetrics.entries()) {
      if (now - metrics.lastRequestTime > maxAge) {
        this.requestMetrics.delete(requestId);
      }
    }
  }

  private applyPerformanceOptimizations(request: any, options: ZodPerformanceOptions): void {
    // Enable compression if supported
    if (options.enableCompression) {
      this.enableCompression(request);
    }

    // Optimize request processing
    if (options.enableSchemaOptimization) {
      this.optimizeRequestProcessing(request);
    }

    // Apply caching headers
    if (options.enableCaching) {
      this.applyCachingHeaders(request, options);
    }
  }

  private enableCompression(request: any): void {
    // Set compression headers
    const response = request.res;
    if (response && !response.getHeader('content-encoding')) {
      response.setHeader('content-encoding', 'gzip');
    }
  }

  private optimizeRequestProcessing(request: any): void {
    // Optimize JSON parsing for large payloads
    if (request.body && typeof request.body === 'string') {
      try {
        request.body = JSON.parse(request.body);
      } catch (error) {
        this.logger.warn('Failed to parse JSON body:', error);
      }
    }

    // Optimize array processing
    if (Array.isArray(request.body)) {
      // Pre-validate array length
      if (request.body.length > 1000) {
        this.logger.warn(`Large array detected: ${request.body.length} items`);
      }
    }
  }

  private applyCachingHeaders(request: any, options: ZodPerformanceOptions): void {
    const response = request.res;
    if (response) {
      response.setHeader('cache-control', `max-age=${Math.floor(options.cacheTtl / 1000)}`);
      response.setHeader('etag', this.generateETag(request.body));
    }
  }

  private generateETag(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `"${Math.abs(hash).toString(36)}"`;
  }

  // Public methods for monitoring
  getRequestMetrics(): Map<string, any> {
    return new Map(this.requestMetrics);
  }

  getPerformanceStats(): {
    totalRequests: number;
    activeRequests: number;
    averageRequestTime: number;
  } {
    const now = Date.now();
    const activeRequests = Array.from(this.requestMetrics.values())
      .filter(metrics => now - metrics.lastRequestTime < 30000).length;

    const totalRequests = Array.from(this.requestMetrics.values())
      .reduce((sum, metrics) => sum + metrics.requestCount, 0);

    return {
      totalRequests,
      activeRequests,
      averageRequestTime: 0, // Would be calculated from actual timing data
    };
  }

  clearMetrics(): void {
    this.requestMetrics.clear();
  }
}

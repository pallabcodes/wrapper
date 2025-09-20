import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { MetricsService } from './metrics.service';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);

  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    const startTime = Date.now();
    const method = request.method;
    const path = request.route?.path || request.path;
    const userAgent = request.headers['user-agent'] || 'unknown';
    const ip = request.ip || request.connection.remoteAddress || 'unknown';

    // Increment request counter
    this.metricsService.increment('requests.total');
    this.metricsService.increment(`requests.${method.toLowerCase()}`);
    this.metricsService.increment(`requests.path.${this.sanitizePath(path)}`);

    // Record request rate
    this.metricsService.recordRate('requests.rate');

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        // Record response metrics
        this.metricsService.increment('responses.total');
        this.metricsService.increment(`responses.${this.getStatusCategory(statusCode)}`);
        this.metricsService.increment(`responses.${statusCode}`);

        // Record response time histogram
        this.metricsService.recordHistogram('response_time', duration);
        this.metricsService.recordHistogram(`response_time.${method.toLowerCase()}`, duration);
        this.metricsService.recordHistogram(`response_time.${this.sanitizePath(path)}`, duration);

        // Record memory usage
        const memoryUsage = process.memoryUsage();
        this.metricsService.setGauge('memory.heap_used_mb', Math.round(memoryUsage.heapUsed / 1024 / 1024));
        this.metricsService.setGauge('memory.heap_total_mb', Math.round(memoryUsage.heapTotal / 1024 / 1024));
        this.metricsService.setGauge('memory.rss_mb', Math.round(memoryUsage.rss / 1024 / 1024));
        this.metricsService.setGauge('memory.external_mb', Math.round(memoryUsage.external / 1024 / 1024));

        // Record CPU usage (simplified)
        const cpuUsage = process.cpuUsage();
        this.metricsService.setGauge('cpu.user_time', cpuUsage.user);
        this.metricsService.setGauge('cpu.system_time', cpuUsage.system);

        // Log slow requests
        if (duration > 1000) {
          this.logger.warn('Slow request detected', {
            method,
            path,
            duration,
            statusCode,
            userAgent,
            ip,
          });
        }

        // Log high memory usage
        const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
        if (heapUsedMB > 200) {
          this.logger.warn('High memory usage detected', {
            method,
            path,
            heapUsedMB,
            userAgent,
            ip,
          });
        }
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode || 500;

        // Record error metrics
        this.metricsService.increment('errors.total');
        this.metricsService.increment(`errors.${this.getStatusCategory(statusCode)}`);
        this.metricsService.increment(`errors.${statusCode}`);
        this.metricsService.recordRate('error_rate');

        // Record error response time
        this.metricsService.recordHistogram('error_response_time', duration);

        this.logger.error('Request failed', {
          method,
          path,
          duration,
          statusCode,
          error: error.message,
          stack: error.stack,
          userAgent,
          ip,
        });

        throw error;
      }),
    );
  }

  private sanitizePath(path: string): string {
    // Replace dynamic segments with placeholders
    return path
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[a-f0-9-]{36}/g, '/:uuid')
      .replace(/\/[a-f0-9-]{8}-[a-f0-9-]{4}-[a-f0-9-]{4}-[a-f0-9-]{4}-[a-f0-9-]{12}/g, '/:uuid')
      .replace(/\/[^/]+/g, (match) => {
        // Check if it looks like an ID (numeric or UUID)
        if (/^\d+$/.test(match.slice(1))) return '/:id';
        if (/^[a-f0-9-]{36}$/.test(match.slice(1))) return '/:uuid';
        if (/^[a-f0-9-]{8}-[a-f0-9-]{4}-[a-f0-9-]{4}-[a-f0-9-]{4}-[a-f0-9-]{12}$/.test(match.slice(1))) return '/:uuid';
        return match;
      });
  }

  private getStatusCategory(statusCode: number): string {
    if (statusCode >= 200 && statusCode < 300) return '2xx';
    if (statusCode >= 300 && statusCode < 400) return '3xx';
    if (statusCode >= 400 && statusCode < 500) return '4xx';
    if (statusCode >= 500) return '5xx';
    return 'unknown';
  }
}

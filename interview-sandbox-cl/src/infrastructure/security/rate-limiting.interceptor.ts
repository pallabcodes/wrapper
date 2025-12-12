import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException, HttpStatus } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { RateLimitConfig } from './security.config';

@Injectable()
export class RateLimitingInterceptor implements NestInterceptor {
  private readonly requests = new Map<string, { count: number; resetTime: number }>();
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(config?: RateLimitConfig) {
    this.windowMs = config?.windowMs ?? 15 * 60 * 1000;
    this.limit = config?.maxRequests ?? 100;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const clientIp = request.ip || request.connection.remoteAddress || 'unknown';
    const key = `${clientIp}:${request.path}`;

    const now = Date.now();
    const clientData = this.requests.get(key);

    if (!clientData || now > clientData.resetTime) {
      // Reset or initialize
      this.requests.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      });

      response.header('X-RateLimit-Remaining', this.limit - 1);
      response.header('X-RateLimit-Reset', new Date(now + this.windowMs).toISOString());
      response.header('X-RateLimit-Limit', this.limit);

      return next.handle();
    }

    if (clientData.count >= this.limit) {
      response.header('X-RateLimit-Remaining', 0);
      response.header('X-RateLimit-Reset', new Date(clientData.resetTime).toISOString());
      response.header('X-RateLimit-Limit', this.limit);
      response.header('Retry-After', Math.ceil((clientData.resetTime - now) / 1000));

      return throwError(() => new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS));
    }

    clientData.count++;
    response.header('X-RateLimit-Remaining', this.limit - clientData.count);
    response.header('X-RateLimit-Reset', new Date(clientData.resetTime).toISOString());
    response.header('X-RateLimit-Limit', this.limit);

    return next.handle().pipe(
      tap(() => {
        // Clean up expired entries periodically
        if (Math.random() < 0.01) { // 1% chance
          this.cleanup();
        }
      })
    );
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, data] of this.requests.entries()) {
      if (now > data.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

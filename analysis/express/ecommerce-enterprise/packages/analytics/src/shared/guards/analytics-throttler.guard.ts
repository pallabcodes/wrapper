import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

interface ThrottlerOptions {
  ttl: number;
  limit: number;
}

interface ThrottlerStorageService {
  increment(key: string, ttl: number): Promise<number>;
}

interface RequestWithConnection extends Request {
  connection?: {
    remoteAddress?: string;
  };
}

@Injectable()
export class AnalyticsThrottlerGuard extends ThrottlerGuard {
  private readonly logger = new Logger(AnalyticsThrottlerGuard.name);

  constructor(
    reflector: Reflector,
    options?: ThrottlerOptions,
    storageService?: ThrottlerStorageService
  ) {
    super(options, storageService, reflector);
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route has custom rate limiting
    const customRateLimit = this.reflector.getAllAndOverride('rateLimit', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (customRateLimit) {
      // Apply custom rate limiting for this route
      const request = context.switchToHttp().getRequest();
      const key = this.generateKey(context, request.ip);
      const ttl = customRateLimit.ttl;
      const limit = customRateLimit.limit;

      const isAllowed = await this.checkLimit(key, ttl, limit);

      if (!isAllowed) {
        this.logger.warn('Rate limit exceeded for route', {
          url: request.url,
          method: request.method,
          ip: request.ip,
          ttl,
          limit,
        });
        throw new ThrottlerException('Rate limit exceeded');
      }

      return true;
    }

    // Fall back to default throttler behavior
    return super.canActivate(context);
  }

  private async checkLimit(_key: string, _ttl: number, _limit: number): Promise<boolean> {
    // This would typically use Redis or another store
    // For now, we'll use a simple in-memory implementation
    // const now = Date.now(); // Temporarily commented out
    // const windowStart = now - (_ttl * 1000); // Temporarily commented out

    // In a real implementation, you would:
    // 1. Check Redis for the current count
    // 2. Increment the count if under limit
    // 3. Set expiration if this is the first request

    // For demonstration, we'll allow all requests
    // In production, implement proper rate limiting logic here

    return true;
  }

  protected override getTracker(req: RequestWithConnection): Promise<string> {
    // Use IP address as the default tracker
    // In production, you might want to use user ID for authenticated requests
    return Promise.resolve(req.ip || req.connection.remoteAddress || 'unknown');
  }

  protected override generateKey(context: ExecutionContext, tracker: string): string {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;

    // Create a unique key based on tracker, method, and URL
    return `${tracker}:${method}:${url}`;
  }

  protected override getErrorMessage(_context: ExecutionContext, _throttlerLimitDetail: unknown): Promise<string> {
    return Promise.resolve('Too many requests. Please try again later.');
  }
}

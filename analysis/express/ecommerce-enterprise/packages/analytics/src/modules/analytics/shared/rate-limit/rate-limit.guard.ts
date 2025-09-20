import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { RATE_LIMIT_KEY } from './rate-limit.decorator';
import { RateLimitOptions } from './rate-limit.types';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly storage: any,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const options = this.reflector.get<RateLimitOptions>(RATE_LIMIT_KEY, context.getHandler());
    if (!options) {
      return true;
    }

    // Skip if condition is met
    if (options.skip && options.skip(request)) {
      return true;
    }

    const key = this.generateKey(request, options);
    const now = Date.now();

    try {
      const info = await this.storage.increment(key, options.windowMs * 1000);
      
      // Set rate limit headers
      response.setHeader('X-RateLimit-Limit', info.limit);
      response.setHeader('X-RateLimit-Remaining', info.remaining);
      response.setHeader('X-RateLimit-Reset', new Date(info.resetTime).toISOString());

      if (info.remaining < 0) {
        const retryAfter = Math.ceil((info.resetTime - now) / 1000);
        response.setHeader('Retry-After', retryAfter.toString());
        
        this.logger.warn(`Rate limit exceeded for key: ${key}`, {
          key,
          limit: info.limit,
          remaining: info.remaining,
          resetTime: info.resetTime,
          retryAfter,
        });

        throw new HttpException(
          {
            message: options.message || 'Too many requests',
            statusCode: options.statusCode || HttpStatus.TOO_MANY_REQUESTS,
            retryAfter,
          },
          options.statusCode || HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Rate limit check failed for key: ${key}`, error);
      // Allow request to proceed if rate limiting fails
      return true;
    }
  }

  private generateKey(request: Request, options: RateLimitOptions): string {
    if (options.keyGenerator) {
      return options.keyGenerator(request);
    }

    // Default: IP-based rate limiting
    const ip = request.ip || request.connection.remoteAddress || 'unknown';
    return `rate_limit:${ip}`;
  }
}

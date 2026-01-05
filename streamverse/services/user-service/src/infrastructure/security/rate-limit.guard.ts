import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { RedisTokenService } from '../cache/redis-token.service';

// Type for accessing connection properties safely
type ExtendedRequest = Request & {
  connection?: {
    remoteAddress?: string;
    socket?: {
      remoteAddress?: string;
    };
  };
};

/**
 * Infrastructure: Rate Limiting Guard
 *
 * Protects authentication endpoints from brute force attacks
 * Uses Redis for distributed rate limiting
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private redisTokenService?: RedisTokenService
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Get client identifier (IP address or user identifier)
    const clientId = this.getClientIdentifier(request);

    // Get rate limit configuration
    const maxRequests = this.configService.get('RATE_LIMIT_MAX_REQUESTS', 10);
    const windowMinutes = this.configService.get('RATE_LIMIT_WINDOW_MINUTES', 15);

    // Check if Redis is available
    if (!this.redisTokenService) {
      // If no Redis, allow request (graceful degradation)
      this.setRateLimitHeaders(response, maxRequests, maxRequests, windowMinutes * 60);
      return true;
    }

    // Check current request count
    const requests = await this.redisTokenService.getFailedLoginAttempts(clientId) || 0;

    // Set rate limit headers
    const remaining = Math.max(0, maxRequests - requests - 1);
    this.setRateLimitHeaders(response, maxRequests, remaining, windowMinutes * 60);

    // Check if rate limit exceeded
    if (requests >= maxRequests) {
      // Get time until reset
      const resetTime = await this.redisTokenService.getAccountUnlockTime(clientId);
      response.header('Retry-After', resetTime.toString());
      return false; // Block request
    }

    // Record this request (treat auth attempts as potential failed logins for rate limiting)
    // Note: This is a simplified approach. In production, you might want separate counters
    // for rate limiting vs failed login tracking
    await this.redisTokenService.recordFailedLogin(clientId, windowMinutes);

    return true; // Allow request
  }

  private getClientIdentifier(request: ExtendedRequest): string {
    // Use IP address as client identifier
    // In production, you might want to use a combination of IP + User-Agent
    const ip = request.ip ||
      request.connection?.remoteAddress ||
      request.connection?.socket?.remoteAddress ||
      'unknown';

    // For IPv6 localhost (::1), use IPv4 equivalent
    return ip === '::1' ? '127.0.0.1' : ip;
  }

  private setRateLimitHeaders(response: Response, limit: number, remaining: number, resetTime: number): void {
    response.header('X-RateLimit-Limit', limit.toString());
    response.header('X-RateLimit-Remaining', remaining.toString());
    response.header('X-RateLimit-Reset', resetTime.toString());
  }
}

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RATE_LIMIT } from '../decorators/rate-limit.decorator';

type Bucket = { tokens: number; lastRefill: number };

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly keyToBucket = new Map<string, Bucket>();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const limit = this.reflector.getAllAndOverride<number>(RATE_LIMIT, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!limit) return true;
    const req = context.switchToHttp().getRequest<{ ip?: string; method: string; route?: { path: string }; originalUrl?: string; url: string }>();
    const key = `${req.ip}:${req.method}:${req.route?.path || req.originalUrl || req.url}`;
    const now = Date.now();
    const bucket = this.keyToBucket.get(key) || { tokens: limit, lastRefill: now };
    // refill per minute
    const elapsed = now - bucket.lastRefill;
    const refill = (elapsed / 60000) * limit;
    bucket.tokens = Math.min(limit, bucket.tokens + refill);
    bucket.lastRefill = now;
    if (bucket.tokens < 1) {
      this.keyToBucket.set(key, bucket);
      return false;
    }
    bucket.tokens -= 1;
    this.keyToBucket.set(key, bucket);
    return true;
  }
}



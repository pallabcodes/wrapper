import { SetMetadata } from '@nestjs/common';
import { RateLimitOptions } from './rate-limit.types';

export const RATE_LIMIT_KEY = 'rate_limit';

export const RateLimit = (options: RateLimitOptions) => SetMetadata(RATE_LIMIT_KEY, options);

// Convenience decorators for common rate limits
export const RateLimitStrict = (max: number = 10, windowMs: number = 60000) =>
  RateLimit({ max, windowMs, message: 'Too many requests, please try again later.' });

export const RateLimitModerate = (max: number = 100, windowMs: number = 60000) =>
  RateLimit({ max, windowMs, message: 'Rate limit exceeded, please slow down.' });

export const RateLimitLoose = (max: number = 1000, windowMs: number = 60000) =>
  RateLimit({ max, windowMs, message: 'Rate limit exceeded.' });

// IP-based rate limiting
export const RateLimitByIP = (max: number, windowMs: number) =>
  RateLimit({
    max,
    windowMs,
    keyGenerator: (req) => `ip:${req.ip || req.connection.remoteAddress}`,
    message: 'Too many requests from this IP address.',
  });

// User-based rate limiting
export const RateLimitByUser = (max: number, windowMs: number) =>
  RateLimit({
    max,
    windowMs,
    keyGenerator: (req) => `user:${req.user?.id || 'anonymous'}`,
    message: 'Too many requests from this user.',
  });

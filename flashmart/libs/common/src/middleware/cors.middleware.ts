import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Enhanced CORS middleware with security considerations
 */
@Injectable()
export class CorsMiddleware implements NestMiddleware {
  private readonly allowedOrigins: string[];
  private readonly allowedMethods: string[];
  private readonly allowedHeaders: string[];
  private readonly exposedHeaders: string[];
  private readonly maxAge: number;

  constructor() {
    // Configure allowed origins - in production, this should be more restrictive
    this.allowedOrigins = process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:3001'];

    this.allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'];
    this.allowedHeaders = [
      'Content-Type',
      'Authorization',
      'X-API-Key',
      'X-Request-ID',
      'X-Correlation-ID',
      'X-API-Version',
      'Accept-Version',
      'Accept',
      'Accept-Language',
      'Cache-Control',
    ];
    this.exposedHeaders = [
      'X-Request-ID',
      'X-Correlation-ID',
      'X-Response-Time',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
      'X-API-Version',
    ];
    this.maxAge = 86400; // 24 hours
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const origin = req.headers.origin as string;

    // Check if origin is allowed
    if (this.allowedOrigins.includes('*') || this.allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }

    // Set other CORS headers
    res.setHeader('Access-Control-Allow-Methods', this.allowedMethods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', this.allowedHeaders.join(', '));
    res.setHeader('Access-Control-Expose-Headers', this.exposedHeaders.join(', '));
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', this.maxAge.toString());

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    next();
  }
}

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly helmetMiddleware = helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Required for GraphQL Playground
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  });

  use(req: Request, res: Response, next: NextFunction) {
    // Apply Helmet security headers
    this.helmetMiddleware(req, res, () => {
      // Additional security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

      // Remove fingerprinting headers
      res.removeHeader('X-Powered-By');

      next();
    });
  }
}

@Injectable()
export class CorsMiddleware implements NestMiddleware {
  private readonly allowedOrigins: string[];
  private readonly allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
  private readonly allowedHeaders = [
    'Content-Type',
    'Authorization',
    'X-API-Key',
    'X-Request-ID',
    'X-API-Version',
    'Accept-Version',
    'Accept',
    'Origin',
  ];
  private readonly exposedHeaders = [
    'X-Request-ID',
    'X-Response-Time',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-API-Version',
  ];

  constructor() {
    // In production, load from environment
    this.allowedOrigins = process.env.CORS_ORIGINS?.split(',') || ['*'];
  }

  use(req: Request, res: Response, next: NextFunction) {
    const origin = req.headers.origin;

    // Check if origin is allowed
    if (this.allowedOrigins.includes('*') || (origin && this.allowedOrigins.includes(origin))) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', this.allowedMethods.join(', '));
      res.setHeader('Access-Control-Allow-Headers', this.allowedHeaders.join(', '));
      res.setHeader('Access-Control-Expose-Headers', this.exposedHeaders.join(', '));
      res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours preflight cache
    }

    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    next();
  }
}

// IP Whitelist middleware for internal services
@Injectable()
export class IPWhitelistMiddleware implements NestMiddleware {
  private readonly whitelist: string[];

  constructor() {
    // Load from environment or config
    this.whitelist = process.env.IP_WHITELIST?.split(',') || [
      '127.0.0.1',
      '::1',
      '10.0.0.0/8',      // Internal Kubernetes network
      '172.16.0.0/12',   // Docker bridge network
      '192.168.0.0/16',  // Private network
    ];
  }

  use(req: Request, res: Response, next: NextFunction) {
    const clientIp = this.getClientIP(req);

    if (this.isWhitelisted(clientIp)) {
      next();
    } else {
      res.status(403).json({
        success: false,
        error: {
          code: 'IP_NOT_WHITELISTED',
          message: 'Access denied from this IP address',
        },
      });
    }
  }

  private getClientIP(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'] as string;
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || '';
  }

  private isWhitelisted(ip: string): boolean {
    // Simple check - in production, use proper CIDR matching
    return this.whitelist.some(allowed => {
      if (allowed.includes('/')) {
        // CIDR notation - simplified check
        const [network] = allowed.split('/');
        return ip.startsWith(network.split('.').slice(0, 2).join('.'));
      }
      return ip === allowed;
    });
  }
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface SecurityConfig {
  cors: {
    origin: string[];
    credentials: boolean;
    methods: string[];
    allowedHeaders: string[];
    exposedHeaders: string[];
  };
  rateLimit: RateLimitConfig;
  helmet: {
    contentSecurityPolicy: boolean;
    crossOriginEmbedderPolicy: boolean;
  };
}

export function getSecurityConfig(): SecurityConfig {
  const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:3000'];

  const rateLimitWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); // 15m
  const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX || '100', 10);

  return {
    cors: {
      origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-RateLimit-Remaining', 'X-RateLimit-Reset', 'X-RateLimit-Limit'],
  },
    rateLimit: {
      windowMs: rateLimitWindowMs,
      maxRequests: rateLimitMax,
    },
    helmet: {
      contentSecurityPolicy: process.env.CSP_ENABLED !== 'false',
      crossOriginEmbedderPolicy: false, // loosened for compatibility unless enabled explicitly
    },
};
}

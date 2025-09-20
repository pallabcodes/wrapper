import * as Joi from 'joi';

export const configSchema = Joi.object({
  // Server configuration
  PORT: Joi.number().default(3001),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  USE_FASTIFY: Joi.boolean().default(false),

  // Database configuration
  DATABASE_URL: Joi.string().required(),
  DATABASE_POOL_SIZE: Joi.number().default(10),

  // Redis configuration
  REDIS_URL: Joi.string().required(),
  CACHE_TTL: Joi.number().default(3600),

  // JWT configuration
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('1h'),

  // CORS configuration
  CORS_ORIGINS: Joi.string().default('*'),

  // Payment providers
  STRIPE_SECRET_KEY: Joi.string().required(),
  STRIPE_WEBHOOK_SECRET: Joi.string().required(),
  BRAINTREE_MERCHANT_ID: Joi.string().required(),
  BRAINTREE_PUBLIC_KEY: Joi.string().required(),
  BRAINTREE_PRIVATE_KEY: Joi.string().required(),
  PAYPAL_CLIENT_ID: Joi.string().required(),
  PAYPAL_CLIENT_SECRET: Joi.string().required(),
  PAYPAL_MODE: Joi.string().valid('sandbox', 'live').default('sandbox'),

  // Queue configuration
  QUEUE_REDIS_URL: Joi.string().default(Joi.ref('REDIS_URL')),
  QUEUE_CONCURRENCY: Joi.number().default(5),

  // Monitoring
  ENABLE_METRICS: Joi.boolean().default(true),
  METRICS_PORT: Joi.number().default(9090),

  // Tenant configuration
  TENANT_ID_HEADER: Joi.string().default('x-tenant-id'),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),

  // Security
  ENCRYPTION_KEY: Joi.string().required(),
  WEBHOOK_SECRET: Joi.string().required(),
});

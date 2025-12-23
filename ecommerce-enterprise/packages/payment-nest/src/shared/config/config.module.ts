import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(3001),
        DATABASE_URL: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        STRIPE_SECRET_KEY: Joi.string().required(),
        BRAINTREE_MERCHANT_ID: Joi.string().required(),
        BRAINTREE_PUBLIC_KEY: Joi.string().required(),
        BRAINTREE_PRIVATE_KEY: Joi.string().required(),
        PAYPAL_CLIENT_ID: Joi.string().required(),
        PAYPAL_CLIENT_SECRET: Joi.string().required(),
        PAYPAL_MODE: Joi.string().valid('sandbox', 'live').default('sandbox'),
        TENANT_ID_HEADER: Joi.string().default('x-tenant-id'),
      }),
    }),
  ],
  providers: [
    {
      provide: 'PAYMENT_CONFIG',
      useFactory: (configService: ConfigService) => ({
        port: configService.get('PORT', 3001),
        environment: configService.get('NODE_ENV', 'development'),
        useFastify: configService.get('USE_FASTIFY', 'false') === 'true',
        cors: {
          origins: configService.get('CORS_ORIGINS', '*').split(','),
        },
        database: {
          url: configService.get('DATABASE_URL'),
          poolSize: configService.get('DATABASE_POOL_SIZE', 10),
        },
        redis: {
          url: configService.get('REDIS_URL'),
          cacheTtl: configService.get('CACHE_TTL', 3600),
        },
        jwt: {
          secret: configService.get('JWT_SECRET'),
          expiresIn: configService.get('JWT_EXPIRES_IN', '1h'),
        },
        stripe: {
          secretKey: configService.get('STRIPE_SECRET_KEY'),
          webhookSecret: configService.get('STRIPE_WEBHOOK_SECRET'),
        },
        braintree: {
          merchantId: configService.get('BRAINTREE_MERCHANT_ID'),
          publicKey: configService.get('BRAINTREE_PUBLIC_KEY'),
          privateKey: configService.get('BRAINTREE_PRIVATE_KEY'),
        },
        paypal: {
          clientId: configService.get('PAYPAL_CLIENT_ID'),
          clientSecret: configService.get('PAYPAL_CLIENT_SECRET'),
          mode: configService.get('PAYPAL_MODE', 'sandbox'),
        },
        queue: {
          redisUrl: configService.get('QUEUE_REDIS_URL'),
          concurrency: configService.get('QUEUE_CONCURRENCY', 5),
        },
        monitoring: {
          enabled: configService.get('ENABLE_METRICS', true),
          port: configService.get('METRICS_PORT', 9090),
        },
        tenant: {
          headerName: configService.get('TENANT_ID_HEADER', 'x-tenant-id'),
        },
        rateLimit: {
          windowMs: configService.get('RATE_LIMIT_WINDOW_MS', 900000),
          maxRequests: configService.get('RATE_LIMIT_MAX_REQUESTS', 100),
        },
        security: {
          encryptionKey: configService.get('ENCRYPTION_KEY'),
          webhookSecret: configService.get('WEBHOOK_SECRET'),
        },
      }),
      inject: [ConfigService],
    },
  ],
  exports: ['PAYMENT_CONFIG', NestConfigModule],
})
export class ConfigModule {}

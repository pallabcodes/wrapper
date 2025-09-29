import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import helmet from 'helmet';
import compression from 'compression';
import express from 'express';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import fastifyCompress from '@fastify/compress';
import fastifyHelmet from '@fastify/helmet';
import fastifyEtag from '@fastify/etag';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { Server } from 'http';

async function bootstrap() {
  const logger = new Logger('AnalyticsService');

  try {
    const useFastify = process.env['USE_FASTIFY'] === 'true';
    const app = useFastify
      ? await NestFactory.create(
          AnalyticsModule,
          new FastifyAdapter({
            logger: false,
            trustProxy: true,
            bodyLimit: 1_000_000,
            keepAliveTimeout: 75_000,
          }),
          { logger: ['error', 'warn', 'log', 'debug', 'verbose'] },
        )
      : await NestFactory.create(AnalyticsModule, {
          logger: ['error', 'warn', 'log', 'debug', 'verbose'],
        });

    // Global prefix for all routes
    app.setGlobalPrefix('api/v1/analytics');

    // Security and transport tuning
    const instance = app.getHttpAdapter().getInstance();
    if (useFastify) {
      await instance.register(fastifyHelmet);
      await instance.register(fastifyCompress, { global: true });
      await instance.register(fastifyEtag);
    } else {
      app.use(helmet());
      app.use(compression());
      instance.set('trust proxy', true);
      instance.set('etag', 'strong');
      app.use(express.json({ limit: '1mb' }));
      app.use(express.urlencoded({ extended: true, limit: '1mb' }));
    }

    // Enable CORS
    app.enableCors();

    // Get port from environment or use default
    const port = process.env['PORT'] ? parseInt(process.env['PORT'], 10) : 3003;

    await app.listen(port, '0.0.0.0');

    // Tune keep-alive and headers timeout to mitigate request smuggling and slowloris
    if (!useFastify) {
      const server = app.getHttpServer() as Server;
      // Keep alive slightly less than typical LB idle timeout
      server.keepAliveTimeout = 75_000; // 75s
      server.headersTimeout = 76_000; // keepAliveTimeout + 1s
    }

    // Log successful startup
    logger.log(`🚀 Analytics Microservice Started Successfully!`, {
      service: 'analytics-microservice',
      port,
      environment: process.env['NODE_ENV'] || 'development',
      endpoints: {
        api: `http://localhost:${port}/api/v1/analytics`,
        health: `http://localhost:${port}/health`,
      },
    });

  } catch (error) {
    logger.error('❌ Failed to start Analytics Microservice', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      service: 'analytics-microservice',
    });
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

bootstrap();

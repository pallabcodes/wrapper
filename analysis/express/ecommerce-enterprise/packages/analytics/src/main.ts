import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AnalyticsModule } from './modules/analytics/analytics.module';

async function bootstrap() {
  const logger = new Logger('AnalyticsService');

  try {
    // Create NestJS application with Express platform
    const app = await NestFactory.create(AnalyticsModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // Global prefix for all routes
    app.setGlobalPrefix('api/v1/analytics');

    // Enable CORS
    app.enableCors();

    // Get port from environment or use default
    const port = process.env['PORT'] ? parseInt(process.env['PORT'], 10) : 3003;

    await app.listen(port, '0.0.0.0');

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

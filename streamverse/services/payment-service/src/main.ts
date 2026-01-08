// CRITICAL: Initialize tracing BEFORE any other imports
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { initTracing } = require('@streamverse/common');
initTracing('payment-service');

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './presentation/filters/http-exception.filter';
import { PinoLoggerService, CorrelationMiddleware } from '@streamverse/common';

/**
 * Application Bootstrap
 *
 * Initializes and starts the Payment Service with full observability
 */
async function bootstrap() {
  // Create Pino logger for structured logging
  const logger = new PinoLoggerService('payment-service');

  const app = await NestFactory.create(AppModule, {
    // CRITICAL: Raw body parsing required for Stripe webhook signature validation
    rawBody: true,
    // Use Pino for structured logging with correlation IDs
    logger,
  });

  // Get configuration service
  const configService = app.get(ConfigService);

  // Apply correlation middleware for request tracing
  app.use(new CorrelationMiddleware().use.bind(new CorrelationMiddleware()));

  // Enable global validation pipes
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // Enable global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter(configService));

  // Enable CORS for web clients
  app.enableCors({
    origin: configService.get('CORS_ORIGIN', '*'),
    credentials: true,
  });

  // Get port from environment or default to 3002
  const port = configService.get('PORT', 3002);

  await app.listen(port);

  logger.log(`🚀 StreamVerse Payment Service running on: http://localhost:${port}`);
  logger.log(`📊 Health check: http://localhost:${port}/health`);
  logger.log(`📈 Metrics: http://localhost:${port}/metrics`);
  logger.log(`💳 Payment API: http://localhost:${port}/payments`);
}

bootstrap();

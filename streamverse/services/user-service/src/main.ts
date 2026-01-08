// CRITICAL: Initialize tracing BEFORE any other imports
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { initTracing } = require('@streamverse/common');
initTracing('user-service');

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { validateEnvironment, getEnvironmentSummary } from './infrastructure/config/env-validation';
import { GlobalExceptionFilter } from './presentation/filters/http-exception.filter';
import { PinoLoggerService, CorrelationMiddleware } from '@streamverse/common';

/**
 * Application Bootstrap
 *
 * Initializes and starts the User Service with full observability
 */
async function bootstrap() {
  // Create Pino logger for structured logging
  const logger = new PinoLoggerService('user-service');

  const app = await NestFactory.create(AppModule, {
    // Use Pino for structured logging with correlation IDs
    logger,
  });

  // Get configuration service
  const configService = app.get(ConfigService);

  // Validate environment variables
  validateEnvironment(configService);

  // Log environment summary
  const envSummary = getEnvironmentSummary(configService);
  logger.log(`Service Configuration: ${JSON.stringify(envSummary)}`);

  // Apply correlation middleware for request tracing
  app.use(new CorrelationMiddleware().use.bind(new CorrelationMiddleware()));

  // Enable cookie parsing middleware (required for HttpOnly refresh tokens)
  app.use(cookieParser());

  // Enable global exception filter (Clean Architecture: Domain Exception Mapping)
  app.useGlobalFilters(new GlobalExceptionFilter(configService));

  // Enable global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Enable CORS for web clients
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Get port from environment or default to 3001
  const port = configService.get('PORT', 3001);

  await app.listen(port);

  logger.log(`🚀 StreamVerse User Service running on: http://localhost:${port}`);
  logger.log(`📊 Health check: http://localhost:${port}/health`);
  logger.log(`📈 Metrics: http://localhost:${port}/metrics`);
  logger.log(`📚 API docs: http://localhost:${port}/api`);
}

bootstrap();

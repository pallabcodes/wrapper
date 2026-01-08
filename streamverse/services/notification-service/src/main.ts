// CRITICAL: Initialize tracing BEFORE any other imports
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { initTracing } = require('@streamverse/common');
initTracing('notification-service');

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { validateEnvironment, getEnvironmentSummary } from './infrastructure/config/env-validation';
import { PinoLoggerService, CorrelationMiddleware } from '@streamverse/common';

/**
 * Application Bootstrap
 *
 * Initializes and starts the Notification Service with full observability
 */
async function bootstrap() {
  // Create Pino logger for structured logging
  const logger = new PinoLoggerService('notification-service');

  // Create HTTP application for REST API
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

  // Enable global validation pipes
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // Enable CORS for web clients
  app.enableCors({
    origin: configService.get('CORS_ORIGIN', '*'),
    credentials: true,
  });

  // Get port from environment or default to 3003
  const port = configService.get('PORT', 3003);

  // Start HTTP server
  await app.listen(port);

  // Create microservice for Kafka message consumption
  const microservice = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          brokers: [configService.get('KAFKA_BROKERS', 'localhost:9092')],
        },
        consumer: {
          groupId: 'notification-service',
        },
      },
    }
  );

  // Start microservice (Kafka consumer)
  await microservice.listen();

  logger.log(`🔔 StreamVerse Notification Service running:`);
  logger.log(`  🌐 HTTP API: http://localhost:${port}`);
  logger.log(`  📊 Health check: http://localhost:${port}/health`);
  logger.log(`  📈 Metrics: http://localhost:${port}/metrics`);
  logger.log(`  📨 Kafka Consumer: Active (group: notification-service)`);
}

bootstrap();

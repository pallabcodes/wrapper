import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { validateEnvironment, getEnvironmentSummary } from './infrastructure/config/env-validation';

/**
 * Application Bootstrap
 *
 * Initializes and starts the Notification Service
 */
async function bootstrap() {
  // Create HTTP application for REST API
  const app = await NestFactory.create(AppModule);

  // Get configuration service
  const configService = app.get(ConfigService);

  // Validate environment variables
  validateEnvironment(configService);

  // Log environment summary
  const envSummary = getEnvironmentSummary(configService);
  console.log('🔧 Notification Service Configuration:', JSON.stringify(envSummary, null, 2));

  // Enable global validation pipes
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // Enable CORS for web clients
  app.enableCors({
    origin: configService.get('CORS_ORIGIN', '*'), // Allow all origins for development
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
          groupId: 'notification-service', // Consumer group for load balancing
        },
      },
    }
  );

  // Start microservice (Kafka consumer)
  await microservice.listen();

  console.log(`🔔 StreamVerse Notification Service running:`);
  console.log(`  🌐 HTTP API: http://localhost:${port}`);
  console.log(`  📊 Health check: http://localhost:${port}/health`);
  console.log(`  📧 REST API: http://localhost:${port}/notifications`);
  console.log(`  📚 API docs: http://localhost:${port}/api`);
  console.log(`  📨 Kafka Consumer: Active (group: notification-service)`);
  console.log(`  🔔 Consuming events: user.email.verification, user.password.reset, user.welcome, etc.`);
}

bootstrap();

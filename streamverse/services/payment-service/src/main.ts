import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

/**
 * Application Bootstrap
 *
 * Initializes and starts the Payment Service
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // CRITICAL: Raw body parsing required for Stripe webhook signature validation
    rawBody: true
  });

  // Get configuration service
  const configService = app.get(ConfigService);

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

  // Get port from environment or default to 3002 (different from user-service)
  const port = configService.get('PORT', 3002);

  await app.listen(port);

  console.log(`🚀 StreamVerse Payment Service running on: http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`💳 Payment API: http://localhost:${port}/payments`);
  console.log(`📚 API docs: http://localhost:${port}/api`);
}

bootstrap();

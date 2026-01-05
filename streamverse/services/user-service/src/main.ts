import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { validateEnvironment, getEnvironmentSummary } from './infrastructure/config/env-validation';
import { GlobalExceptionFilter } from './presentation/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get configuration service
  const configService = app.get(ConfigService);

  // Validate environment variables
  validateEnvironment(configService);

  // Log environment summary
  const envSummary = getEnvironmentSummary(configService);
  console.log('🔧 Service Configuration:', JSON.stringify(envSummary, null, 2));

  // Enable cookie parsing middleware (required for HttpOnly refresh tokens)
  app.use(cookieParser());

  // Enable global exception filter (Clean Architecture: Domain Exception Mapping)
  app.useGlobalFilters(new GlobalExceptionFilter(configService));

  // Enable global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,        // Strip unknown properties
    forbidNonWhitelisted: true, // Error on unknown properties
    transform: true,        // Transform to DTO instances
  }));

  // Enable CORS for web clients (allow all origins for development)
  app.enableCors({
    origin: true, // Allow all origins (development only)
    credentials: true,
  });

  // Get port from environment or default to 3001
  const port = configService.get('PORT', 3001);

  await app.listen(port);

  console.log(`🚀 StreamVerse User Service running on: http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`📚 API docs: http://localhost:${port}/api`);
}

bootstrap();


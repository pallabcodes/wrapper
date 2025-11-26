import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { RateLimitingInterceptor } from './infrastructure/security/rate-limiting.interceptor';
import { SanitizationMiddleware } from './infrastructure/security/sanitization.middleware';
import { securityConfig } from './infrastructure/security/security.config';
import { CustomLoggerService } from './infrastructure/logging/logger.service';

async function bootstrap() {
  // Create custom logger instance
  const customLogger = new CustomLoggerService();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false, // Disable Fastify's built-in logger
      trustProxy: true,
    }),
  );

  // Use custom logger
  app.useLogger(customLogger);

  // Security: Apply helmet for security headers
  app.use(securityConfig.helmet);

  // Security: Apply input sanitization middleware
  app.use(new SanitizationMiddleware().use);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: process.env.NODE_ENV === 'production', // Hide validation details in production
    }),
  );

  // Global interceptors
  const timeoutMs = parseInt(process.env.REQUEST_TIMEOUT_MS || '30000', 10);
  app.useGlobalInterceptors(
    new TimeoutInterceptor(timeoutMs),
    new RateLimitingInterceptor(), // Rate limiting
  );

  // Enhanced Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Interview Sandbox - Clean Architecture API')
    .setDescription('Production-ready Clean Architecture NestJS API with comprehensive security')
    .setVersion('1.0.0')
    .addTag('Authentication', 'User authentication endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth'
    )
    .addServer('http://localhost:3000', 'Development server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // Enhanced CORS configuration
  app.enableCors(securityConfig.cors);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  customLogger.log(`🚀 Application is running on: http://localhost:${port}`, 'Bootstrap');
  customLogger.log(`📚 Swagger documentation: http://localhost:${port}/api-docs`, 'Bootstrap');
  customLogger.log(`🔒 Security enabled: Helmet, Rate Limiting, Input Sanitization`, 'Bootstrap');
}

bootstrap();


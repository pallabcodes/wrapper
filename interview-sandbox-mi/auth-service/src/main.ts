/**
 * Bootstrap: Auth Service - Production Ready
 *
 * Enterprise-grade microservice with:
 * - Swagger API documentation
 * - Health checks and monitoring
 * - Proper error handling
 * - CORS configuration
 * - Global validation
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('AuthService');

  try {
    const app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter({
        logger: true,
        trustProxy: true,
        ignoreTrailingSlash: true,
        bodyLimit: 10485760, // 10MB
      }),
    );

    // Global validation with detailed error messages
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
        disableErrorMessages: false,
      }),
    );

    // Swagger API Documentation
    const config = new DocumentBuilder()
      .setTitle('Auth Service API')
      .setDescription('Authentication Microservice - Hexagonal Architecture')
      .setVersion('1.0')
      .addTag('Authentication', 'User authentication endpoints')
      .addTag('Health', 'Service health checks')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);

    // CORS configuration for microservices
    app.enableCors({
      origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://localhost:8080'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key'],
    });

    // Global prefix for API versioning
    app.setGlobalPrefix('api/v1');

    const port = process.env.PORT || 3001;
    await app.listen(port, '0.0.0.0');

    logger.log(`🚀 Auth Service (Microservice) running on: http://localhost:${port}`);
    logger.log(`📚 Swagger API Docs: http://localhost:${port}/api-docs`);
    logger.log(`❤️  Health Check: http://localhost:${port}/api/v1/health`);
    logger.log(`🔄 Service Discovery: Redis events enabled`);

  } catch (error) {
    logger.error('❌ Failed to start Auth Service', error instanceof Error ? error.stack : String(error));
    process.exit(1);
  }
}

bootstrap();


import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

/**
 * Bootstrap Application
 * 
 * Configures and starts the NestJS application with:
 * - Global validation pipes
 * - Swagger API documentation
 * - CORS (if needed)
 * - Fastify transport layer
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    const app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter({
        logger: true,
        trustProxy: true,
      }),
    );
    const configService = app.get(ConfigService);

    // Global validation pipe with transform
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // Strip properties that don't have decorators
        forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
        transform: true, // Automatically transform payloads to DTO instances
        transformOptions: {
          enableImplicitConversion: true, // Enable implicit type conversion
        },
      }),
    );

    // Swagger API Documentation
    const config = new DocumentBuilder()
      .setTitle('Hexagonal Architecture API')
      .setDescription('API documentation for Hexagonal Architecture example')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Authentication', 'Authentication and authorization endpoints')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    // CORS configuration (if needed)
    app.enableCors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    });

    const port = process.env.PORT || 3005;
    await app.listen(port, '0.0.0.0');

    logger.log(`🚀 Hexagonal Architecture application is running on: http://localhost:${port}`);
    logger.log(`📚 Swagger documentation: http://localhost:${port}/api`);
    logger.log(`🏗️ Architecture: Domain ↔ Application ↔ Infrastructure (Ports & Adapters)`);
  } catch (error) {
    logger.error('Failed to start application', error instanceof Error ? error.stack : String(error));
    process.exit(1);
  }
}

bootstrap();


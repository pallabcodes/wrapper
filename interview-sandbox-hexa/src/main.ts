import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as session from 'express-session';
import { ConfigService } from '@nestjs/config';

/**
 * Bootstrap Application
 * 
 * Configures and starts the NestJS application with:
 * - Global validation pipes
 * - Session middleware
 * - Swagger API documentation
 * - CORS (if needed)
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    const app = await NestFactory.create(AppModule);
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

    // Configure session for Passport
    const sessionConfig = configService.get('auth.session', {
      secret: 'your-session-secret-change-in-production',
      maxAge: 86400000,
      httpOnly: true,
      secure: false,
    });

    app.use(
      session({
        secret: sessionConfig.secret,
        resave: false,
        saveUninitialized: false,
        cookie: {
          maxAge: sessionConfig.maxAge,
          httpOnly: sessionConfig.httpOnly,
          secure: sessionConfig.secure,
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

    const port = process.env.PORT || 3000;
    await app.listen(port);
    
    logger.log(`Application is running on: http://localhost:${port}`);
    logger.log(`Swagger documentation available at: http://localhost:${port}/api`);
  } catch (error) {
    logger.error('Failed to start application', error instanceof Error ? error.stack : String(error));
    process.exit(1);
  }
}

bootstrap();


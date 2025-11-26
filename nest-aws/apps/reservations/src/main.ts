import { ValidationPipe, Logger as NestLogger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { SwaggerModuleConfig } from '@app/common';

import { ReservationsModule } from './reservations.module';

async function bootstrap() {
  const app = await NestFactory.create(ReservationsModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const logger = app.get(Logger);

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));

  // CORS configuration
  app.enableCors({
    origin: configService.get('CORS_ORIGIN', 'http://localhost:3000'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    disableErrorMessages: configService.get('NODE_ENV') === 'production',
  }));

  // Global prefix for API versioning
  app.setGlobalPrefix('api/v1');

  // Cookie parser
  app.use(cookieParser());

  // Logger
  app.useLogger(app.get(Logger));

  // Swagger documentation
  SwaggerModuleConfig.setup(app, {
    title: 'Reservations Service API',
    description: 'Hotel/accommodation reservation management service',
    version: '1.0',
  });

  const port = configService.get('PORT', 3000);
  await app.listen(port);

  logger.log(`🚀 Reservations service running on http://localhost:${port}`);
  logger.log(`📚 API documentation available at http://localhost:${port}/api`);
}
bootstrap();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('PaymentService');
  
  // Create NestJS application
  const app = await NestFactory.create(
    AppModule,
    new FastifyAdapter({
      logger: true,
      trustProxy: true,
    }) as any,
    {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    }
  );

  const configService = app.get(ConfigService);
  const port = configService.get('PORT', 3001);
  // const _useFastify = configService.get('USE_FASTIFY', 'false') === 'true';

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // CORS configuration
  app.enableCors({
    origin: configService.get('CORS_ORIGINS', '*').split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-tenant-id'],
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Payment Service API')
    .setDescription('Enterprise-grade payment processing with multi-provider support')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('payments', 'Payment processing endpoints')
    .addTag('webhooks', 'Webhook handling endpoints')
    .addTag('analytics', 'Payment analytics endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.log('SIGTERM received, shutting down gracefully');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.log('SIGINT received, shutting down gracefully');
    await app.close();
    process.exit(0);
  });

  // Start server
  await app.listen(port, '0.0.0.0');
  logger.log(`Payment service is running on: http://localhost:${port}`);
  logger.log(`Swagger documentation: http://localhost:${port}/api/docs`);
}

bootstrap().catch((error) => {
  console.error('Failed to start payment service:', error);
  process.exit(1);
});

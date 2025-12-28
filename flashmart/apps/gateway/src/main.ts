import { NestFactory } from '@nestjs/core';
import { GatewayModule } from './gateway.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter, GraphQLExceptionFilter, SecurityMiddleware, CorsMiddleware } from '@flashmart/common';

async function bootstrap() {
  const logger = new Logger('Gateway');
  const app = await NestFactory.create(GatewayModule, {
    logger: ['log', 'error', 'warn', 'debug'],
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  // Global exception filters
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Apply security and CORS middleware
  app.use(new SecurityMiddleware().use);
  app.use(new CorsMiddleware().use);

  // Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('FlashMart API Gateway')
    .setDescription('Unified API Gateway for FlashMart microservices')
    .setVersion('1.0')
    .addTag('gateway', 'API Gateway endpoints')
    .addTag('health', 'Health check endpoints')
    .addTag('metrics', 'Metrics endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API Key for authentication',
      },
      'api-key',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  });

  // Global error handling
  app.enableShutdownHooks();

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 API Gateway running on http://localhost:${port}`);
  logger.log(`📊 Metrics: http://localhost:${port}/metrics`);
  logger.log(`🏥 Health: http://localhost:${port}/health`);
  logger.log(`📡 GraphQL: http://localhost:${port}/graphql`);
  logger.log(`📖 API Docs: http://localhost:${port}/api-docs`);
}

bootstrap();

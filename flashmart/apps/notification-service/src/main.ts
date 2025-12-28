import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NotificationServiceModule } from './notification-service.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter, GraphQLExceptionFilter, SecurityMiddleware, CorsMiddleware } from '@flashmart/common';

async function bootstrap() {
  const app = await NestFactory.create(NotificationServiceModule);

  // Apply security and CORS middleware
  app.use(new SecurityMiddleware().use);
  app.use(new CorsMiddleware().use);

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

  // Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('FlashMart Notification Service')
    .setDescription('Notification and messaging service')
    .setVersion('1.0')
    .addTag('notifications', 'Notification management endpoints')
    .addTag('messages', 'Message sending endpoints')
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
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 3007;
  await app.listen(port);
  console.log(`🔔 Notification Service running on http://localhost:${port}`);
  console.log(`📖 API Docs: http://localhost:${port}/api-docs`);
}
bootstrap();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Event-Driven Architecture API')
    .setDescription('Event-Driven NestJS Application with Domain Events')
    .setVersion('1.0')
    .addTag('Authentication', 'User authentication with event-driven patterns')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // CORS
  app.enableCors();

  const port = process.env.PORT || 3003;
  await app.listen(port);

  console.log(`🚀 Event-Driven Architecture application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api-docs`);
  console.log(`📡 Event bus is active and listening for domain events`);
}

bootstrap();


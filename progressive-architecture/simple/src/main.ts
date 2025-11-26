import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable global validation pipes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strip properties that do not have decorators
    transform: true, // Transform payloads to DTO instances
  }));

  // Enable CORS for development
  app.enableCors();

  await app.listen(3000);
  console.log('🚀 Simple JWT Auth running on: http://localhost:3000');
}

bootstrap();
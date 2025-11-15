/**
 * Main Entry Point (for local development)
 * 
 * This file is used for local development/testing
 * In production, Lambda handlers are used instead
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Global validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // CORS
  app.enableCors();
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 Serverless NestJS app running on http://localhost:${port}`);
  console.log(`📝 Note: This is for local development. In production, use Lambda handlers.`);
}

bootstrap();


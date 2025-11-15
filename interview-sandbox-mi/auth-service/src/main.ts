/**
 * Bootstrap: Auth Service
 * 
 * Starts the NestJS application
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: true,
      trustProxy: true,
    }),
  );
  
  // Global validation
  app.useGlobalPipes(new ValidationPipe());
  
  // CORS
  app.enableCors();
  
  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Auth Service running on http://localhost:${port}`);
}

bootstrap();


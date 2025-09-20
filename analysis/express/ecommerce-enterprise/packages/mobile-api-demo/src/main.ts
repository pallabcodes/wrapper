import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for mobile apps
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Device-Platform',
      'X-Device-Version',
      'X-Device-Model',
      'X-Screen-Size',
      'X-Connection-Speed',
      'X-App-Version',
      'X-Timezone',
      'X-Latitude',
      'X-Longitude',
      'X-Location-Accuracy',
      'X-Biometric-Token',
      'X-Auth-Token',
      'X-User-Id',
    ],
    credentials: true,
  });

  // Add global prefix
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3017;
  await app.listen(port);
  
  const logger = new Logger('MobileApiDemo');
  logger.log(`Mobile API Demo service running on http://localhost:${port}`);
  logger.log(`API Documentation: http://localhost:${port}/api/v1/mobile-api-demo/health`);
  logger.log(`Test endpoints:`);
  logger.log(`  - Products: GET http://localhost:${port}/api/v1/mobile-api-demo/products`);
  logger.log(`  - Product Details: GET http://localhost:${port}/api/v1/mobile-api-demo/products/product-123`);
  logger.log(`  - User Profile: GET http://localhost:${port}/api/v1/mobile-api-demo/profile/user-123`);
  logger.log(`  - Offline Data: GET http://localhost:${port}/api/v1/mobile-api-demo/offline/user-123`);
  logger.log(`  - Push Notification: POST http://localhost:${port}/api/v1/mobile-api-demo/notifications/user-123`);
  logger.log(`  - Analytics: GET http://localhost:${port}/api/v1/mobile-api-demo/analytics`);
  logger.log(`  - Performance: GET http://localhost:${port}/api/v1/mobile-api-demo/performance`);
  logger.log(`  - Test Optimization: GET http://localhost:${port}/api/v1/mobile-api-demo/test/optimization`);
  logger.log(`  - Test Caching: GET http://localhost:${port}/api/v1/mobile-api-demo/test/caching`);
  logger.log(`  - Test Security: GET http://localhost:${port}/api/v1/mobile-api-demo/test/security`);
}

bootstrap();

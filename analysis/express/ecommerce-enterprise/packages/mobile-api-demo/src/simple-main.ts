import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { SimpleAppModule } from './simple-app.module';

async function bootstrap() {
  const app = await NestFactory.create(SimpleAppModule);
  const port = 3017;
  await app.listen(port);
  const logger = new Logger('SimpleMobileApiDemo');
  logger.log(`Simple Mobile API Demo service running on http://localhost:${port}`);
  logger.log(`API Documentation: http://localhost:${port}/api/v1/mobile-api-demo/health`);
  logger.log(`Test endpoints:`);
  logger.log(`  - Health: GET http://localhost:${port}/api/v1/mobile-api-demo/health`);
  logger.log(`  - Test: GET http://localhost:${port}/api/v1/mobile-api-demo/test`);
  logger.log(`  - Products: GET http://localhost:${port}/api/v1/mobile-api-demo/products`);
}
bootstrap();
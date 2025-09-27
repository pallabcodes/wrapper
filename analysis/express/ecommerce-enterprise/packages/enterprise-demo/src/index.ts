import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env['PORT'] || 3008;
  
  await app.listen(port);
  
  const logger = new Logger('EnterpriseDemo');
  logger.log(`🏢 Enterprise Integration Demo Service running on http://localhost:${port}`);
  logger.log(`📊 Health check: http://localhost:${port}/enterprise-demo/health`);
  logger.log(`🔍 Available endpoints:`);
  logger.log(`  GET  /enterprise-demo/health - System health status`);
  logger.log(`  GET  /enterprise-demo/stats - Integration statistics`);
  logger.log(`  GET  /enterprise-demo/sap - SAP integration demo`);
  logger.log(`  GET  /enterprise-demo/salesforce - Salesforce integration demo`);
  logger.log(`  GET  /enterprise-demo/sync - Data synchronization demo`);
  logger.log(`  GET  /enterprise-demo/conflict-resolution - Conflict resolution demo`);
  logger.log(`  GET  /enterprise-demo/bulk - Bulk operations demo`);
  logger.log(`  POST /enterprise-demo/cache/clear - Clear integration cache`);
  logger.log(`  POST /enterprise-demo/circuit-breakers/reset - Reset circuit breakers`);
  logger.log(`  POST /enterprise-demo/validate/user - Validate enterprise user data`);
  logger.log(`  POST /enterprise-demo/validate/product - Validate enterprise product data`);
  logger.log(`  POST /enterprise-demo/validate/order - Validate enterprise order data`);
  logger.log(`  POST /enterprise-demo/validate/integration - Validate enterprise integration data`);
  logger.log(`  POST /enterprise-demo/validate/audit - Validate enterprise audit data`);
  logger.log(`  POST /enterprise-demo/validate/batch - Batch validate multiple entities`);
  logger.log(`  POST /enterprise-demo/validate/ab-test - A/B test validation`);
}

bootstrap();

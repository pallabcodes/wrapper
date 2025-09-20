import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3011;
  
  await app.listen(port);
  
  const logger = new Logger('ComplianceDemo');
  logger.log(`🛡️ Compliance Demo Service running on http://localhost:${port}`);
  logger.log(`📊 Health check: http://localhost:${port}/compliance-demo/status`);
  logger.log(`🔍 Available endpoints:`);
  logger.log(`  GET  /compliance-demo/status - Compliance service status`);
  logger.log(`  GET  /compliance-demo/gdpr - GDPR compliance features demo`);
  logger.log(`  GET  /compliance-demo/sox - SOX compliance features demo`);
  logger.log(`  GET  /compliance-demo/hipaa - HIPAA compliance features demo`);
  logger.log(`  GET  /compliance-demo/breach-handling - Data breach handling demo`);
  logger.log(`  GET  /compliance-demo/reports - Generate compliance reports`);
  logger.log(`  GET  /compliance-demo/configuration - Get compliance configuration`);
  logger.log(`  POST /compliance-demo/test-compliance - Test compliance validation`);
}

bootstrap();

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3012;
  
  await app.listen(port);
  
  const logger = new Logger('MultiRegionDemo');
  logger.log(`🌍 Multi-Region Demo Service running on http://localhost:${port}`);
  logger.log(`📊 Health check: http://localhost:${port}/multi-region-demo/health`);
  logger.log(`🔍 Available endpoints:`);
  logger.log(`  GET  /multi-region-demo/metrics - Global multi-region metrics`);
  logger.log(`  GET  /multi-region-demo/regions - List all regions`);
  logger.log(`  GET  /multi-region-demo/load-balancing - Load balancing demonstration`);
  logger.log(`  GET  /multi-region-demo/data-replication - Data replication demonstration`);
  logger.log(`  GET  /multi-region-demo/failover - Failover demonstration`);
  logger.log(`  GET  /multi-region-demo/data-conflicts - Data conflicts demonstration`);
  logger.log(`  GET  /multi-region-demo/performance - Performance optimization demonstration`);
  logger.log(`  GET  /multi-region-demo/health - Health summary`);
  logger.log(`  POST /multi-region-demo/simulate-failure/:regionId - Simulate region failure`);
  logger.log(`  POST /multi-region-demo/simulate-recovery/:regionId - Simulate region recovery`);
}

bootstrap();

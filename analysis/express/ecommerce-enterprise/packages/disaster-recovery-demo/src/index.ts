import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3013;
  
  await app.listen(port);
  
  const logger = new Logger('DisasterRecoveryDemo');
  logger.log(`🚨 Disaster Recovery Demo Service running on http://localhost:${port}`);
  logger.log(`📊 Health check: http://localhost:${port}/disaster-recovery-demo/health`);
  logger.log(`🔍 Available endpoints:`);
  logger.log(`  GET  /disaster-recovery-demo/status - Overall disaster recovery status`);
  logger.log(`  GET  /disaster-recovery-demo/backup - Backup management status`);
  logger.log(`  GET  /disaster-recovery-demo/restore - Restore operations status`);
  logger.log(`  GET  /disaster-recovery-demo/dr-plans - Disaster recovery plans`);
  logger.log(`  GET  /disaster-recovery-demo/business-continuity - Business continuity status`);
  logger.log(`  GET  /disaster-recovery-demo/recommendations - Recovery recommendations`);
  logger.log(`  GET  /disaster-recovery-demo/report - Generate disaster recovery report`);
  logger.log(`  GET  /disaster-recovery-demo/metrics - System metrics`);
  logger.log(`  POST /disaster-recovery-demo/test/:planId - Test disaster recovery plan`);
  logger.log(`  POST /disaster-recovery-demo/trigger/:planId - Trigger disaster recovery`);
}

bootstrap();

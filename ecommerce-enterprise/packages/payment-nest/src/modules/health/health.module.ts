import { Module } from '@nestjs/common';
import { HealthController } from './controllers/health.controller';
import { HealthService } from './services/health.service';
import { DatabaseModule } from '../../shared/database/database.module';
import { CacheModule } from '../../shared/cache/cache.module';

@Module({
  imports: [DatabaseModule, CacheModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}

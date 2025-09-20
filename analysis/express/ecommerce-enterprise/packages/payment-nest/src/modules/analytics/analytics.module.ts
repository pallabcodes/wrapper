import { Module } from '@nestjs/common';
import { AnalyticsController } from './controllers/analytics.controller';
import { AnalyticsService } from './services/analytics.service';
import { PaymentRepository } from '../payment/repositories/payment.repository';
import { DatabaseModule } from '../../shared/database/database.module';
import { CacheModule } from '../../shared/cache/cache.module';

@Module({
  imports: [DatabaseModule, CacheModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, PaymentRepository],
})
export class AnalyticsModule {}

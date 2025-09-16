import { Module } from '@nestjs/common';

// Controllers
import { AnalyticsController } from './controllers/analytics.controller';

// Services
import { AnalyticsService } from './services/analytics.service';

@Module({
  imports: [],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}

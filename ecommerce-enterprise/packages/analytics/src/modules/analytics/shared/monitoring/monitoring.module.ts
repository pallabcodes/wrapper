import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthCheckService } from './health-check.service';
import { MetricsService } from './metrics.service';
import { AlertingService } from './alerting.service';
import { MonitoringController } from './monitoring.controller';
import { MonitoringScheduler } from './monitoring.scheduler';
import { PerformanceInterceptor } from './performance.interceptor';

@Global()
@Module({
  imports: [ConfigModule, ScheduleModule.forRoot()],
  providers: [
    HealthCheckService,
    MetricsService,
    AlertingService,
    MonitoringScheduler,
    PerformanceInterceptor,
  ],
  controllers: [MonitoringController],
  exports: [HealthCheckService, MetricsService, AlertingService, PerformanceInterceptor],
})
export class MonitoringModule {}

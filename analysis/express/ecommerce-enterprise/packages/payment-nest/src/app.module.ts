import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthXModule } from '@ecommerce-enterprise/authx';
import { PaymentModule } from './modules/payment/payment.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { HealthModule } from './modules/health/health.module';
import { ConfigModule as PaymentConfigModule } from './shared/config/config.module';
import { DatabaseModule } from './shared/database/database.module';
import { CacheModule } from './shared/cache/cache.module';
import { QueueModule } from './shared/queue/queue.module';
import { MonitoringModule } from './shared/monitoring/monitoring.module';
import { configSchema } from './shared/config/config.schema';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    PaymentConfigModule,

    // AuthX integration
    AuthXModule.registerAsync({
      useFactory: (configService) => ({
        jwt: {
          secret: configService.get('JWT_SECRET'),
          expiresIn: configService.get('JWT_EXPIRES_IN', '1h'),
        },
        otp: {
          enabled: configService.get('OTP_ENABLED', 'false') === 'true',
          senderType: configService.get('OTP_SENDER_TYPE', 'console'),
        },
        policies: {
          enabled: true,
        },
        rebac: {
          enabled: true,
        },
        audit: {
          enabled: true,
        },
        tenant: {
          enabled: true,
          headerName: configService.get('TENANT_ID_HEADER', 'x-tenant-id'),
        },
      }),
      inject: [ConfigService],
    }),

    // Infrastructure
    DatabaseModule,
    CacheModule,
    QueueModule,
    MonitoringModule,

    // Feature modules
    PaymentModule,
    WebhookModule,
    AnalyticsModule,
    HealthModule,
  ],
})
export class AppModule {}

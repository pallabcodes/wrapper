import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidatedConfigModule } from './shared/config/config.module';
import { ContextModule } from './shared/cls/context.module';
import { AuthXModule, PermissionsGuard, RelationGuard, AbacGuard, PolicyService } from '@ecommerce-enterprise/authx';

// Controllers
import { AnalyticsController } from './controllers/analytics.controller';
import { AuthController } from './controllers/auth.controller';
import { HealthController } from './controllers/health.controller';
import { AdminAuthController } from './controllers/admin.controller';

// Services
import { AnalyticsService } from './services/analytics.service';
import { AuthAppService } from './services/auth-app.service';
import { TimingInterceptor } from './shared/interceptors/timing.interceptor';
import { RateLimitGuard } from './shared/guards/rate-limit.guard';
import { VersioningGuard } from './shared/versioning/versioning.guard';
import { ResilienceInterceptor } from './shared/resilience/resilience.interceptor';
import { AjvValidationPipe } from './shared/validation/ajv.pipe';
import { FastStringifyInterceptor } from './shared/serialization/fast-stringify.interceptor';
import { APP_PIPE } from '@nestjs/core';
import { CacheSWRInterceptor } from './shared/cache/cache.interceptor';
import { CacheModule } from './shared/cache/cache.module';
import { RequestLoggingInterceptor } from './shared/logging/request-logging.interceptor';
import { ObservabilityModule } from './shared/observability/observability.module';
import { TracingInterceptor } from './shared/observability/tracing.interceptor';
import { MetricsModule } from './shared/observability/metrics.module';
import { MetricsInterceptor } from './shared/observability/metrics.interceptor';
import { IdempotencyInterceptor } from './shared/idempotency/idempotency.interceptor';
import { FlagsModule } from './shared/flags/flags.module';
import { FlagsGuard } from './shared/flags/flags.guard';
import { OutboxModule } from './shared/outbox/outbox.module';
import { OutboxInterceptor } from './shared/outbox/outbox.interceptor';
import { BatchingModule } from './shared/db/batching.module';
import { RateLimitModule } from './shared/rate-limit/rate-limit.module';
import { VersioningModule } from './shared/versioning/versioning.module';
import { ValidationModule } from './shared/validation/validation.module';
import { MonitoringModule } from './shared/monitoring/monitoring.module';
import { PerformanceInterceptor } from './shared/monitoring/performance.interceptor';
import { EventRepository } from './repositories/event.repository';
import { bootstrapPolicies } from './shared/auth/policy.bootstrap';

@Module({
  imports: [
    ValidatedConfigModule,
    ContextModule,
    ObservabilityModule,
    MetricsModule,
    CacheModule,
    FlagsModule,
    OutboxModule,
    BatchingModule,
    RateLimitModule,
    VersioningModule,
    ValidationModule,
    MonitoringModule,
    AuthXModule.registerAsync({
      imports: [ValidatedConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const jwtCfg: any = {
          accessTtlSeconds: 900,
          refreshTtlSeconds: 60 * 60 * 24 * 30,
          issuer: 'ecommerce-enterprise',
          audience: 'ecommerce-clients',
        };
        const priv = cfg.get<string>('JWT_PRIVATE_KEY_PEM');
        const pub = cfg.get<string>('JWT_PUBLIC_KEY_PEM');
        if (priv) jwtCfg.privateKeyPem = priv;
        if (pub) jwtCfg.publicKeyPem = pub;
        return {
          session: { ttlSeconds: 60 * 60 * 24 * 7 },
          jwt: jwtCfg,
        };
      },
    }),
  ],
  controllers: [AnalyticsController, AuthController, HealthController, AdminAuthController],
  providers: [
    AnalyticsService,
    EventRepository,
    AuthAppService,
    { provide: APP_PIPE, useClass: AjvValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: RequestLoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: PerformanceInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TimingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TracingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
    { provide: APP_INTERCEPTOR, useClass: FastStringifyInterceptor },
    { provide: APP_INTERCEPTOR, useClass: IdempotencyInterceptor },
    { provide: APP_INTERCEPTOR, useClass: OutboxInterceptor },
    { provide: APP_INTERCEPTOR, useClass: CacheSWRInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ResilienceInterceptor },
    { provide: APP_GUARD, useClass: FlagsGuard },
    { provide: APP_GUARD, useClass: RateLimitGuard },
    { provide: APP_GUARD, useClass: VersioningGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: RelationGuard },
    { provide: APP_GUARD, useClass: AbacGuard },
    // Bootstrap default policies
    {
      provide: 'BOOTSTRAP_POLICIES',
      useFactory: (policies: PolicyService) => {
        bootstrapPolicies(policies);
      },
      inject: [PolicyService],
    },
  ],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}

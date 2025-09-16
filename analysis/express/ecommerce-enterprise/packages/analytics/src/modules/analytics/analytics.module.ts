import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthXModule } from '@ecommerce-enterprise/authx';

// Controllers
import { AnalyticsController } from './controllers/analytics.controller';
import { AuthController } from './controllers/auth.controller';
import { HealthController } from './controllers/health.controller';

// Services
import { AnalyticsService } from './services/analytics.service';
import { AuthAppService } from './services/auth-app.service';
import { TimingInterceptor } from './shared/interceptors/timing.interceptor';
import { RateLimitGuard } from './shared/guards/rate-limit.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthXModule.registerAsync({
      imports: [ConfigModule],
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
  controllers: [AnalyticsController, AuthController, HealthController],
  providers: [
    AnalyticsService,
    AuthAppService,
    { provide: APP_INTERCEPTOR, useClass: TimingInterceptor },
    { provide: APP_GUARD, useClass: RateLimitGuard },
  ],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}

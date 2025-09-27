import { Module, DynamicModule, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { MobileApiService } from './services/mobile-api.service';
import { MobileOptimizationService } from './services/mobile-optimization.service';
import { MobileCachingService } from './services/mobile-caching.service';
import { MobileSecurityService } from './services/mobile-security.service';
import { MobileApiInterceptor } from './interceptors/mobile-api.interceptor';
import { MobileCacheInterceptor } from './interceptors/mobile-cache.interceptor';
import { MobileOptimizationInterceptor } from './interceptors/mobile-optimization.interceptor';
import { MobileSecurityGuard } from './guards/mobile-security.guard';
import { RbacGuard } from './guards/rbac.guard';
import { MobileApiOptions } from './interfaces/mobile-api.interface';
import { AuthContextInterceptor } from './interceptors/auth-context.interceptor';
import { RbacService } from './services/rbac.service';
import { RedisRbacPolicyProvider } from './services/redis-rbac.provider';
import { RBAC_POLICY_PROVIDER } from './interfaces/mobile-api.interface';

@Module({})
export class MobileApiModule {
  static forRoot(options: MobileApiOptions = {}): DynamicModule {
    const providers: Provider[] = [
      MobileApiService,
      MobileOptimizationService,
      MobileCachingService,
      MobileSecurityService,
      MobileApiInterceptor,
      MobileCacheInterceptor,
      MobileOptimizationInterceptor,
      MobileSecurityGuard,
      RbacGuard,
      RbacService,
      RedisRbacPolicyProvider,
      {
        provide: RBAC_POLICY_PROVIDER,
        useExisting: RedisRbacPolicyProvider,
      },
      AuthContextInterceptor,
      {
        provide: 'MOBILE_API_OPTIONS',
        useValue: options,
      },
    ];

    return {
      module: MobileApiModule,
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        CacheModule.registerAsync({
          inject: [ConfigService],
          useFactory: async (config: ConfigService) => {
            const redisUrl = config.get<string>('REDIS_URL');
            if (redisUrl) {
              // Lazy import to avoid bundling issues when Redis is not used
              const { default: redisStore } = await import('cache-manager-redis-store');
              return {
                store: redisStore as any,
                url: redisUrl,
                ttl: 300,
              } as any;
            }
            return {
              ttl: 300,
              max: 1000,
            };
          },
        }),
      ],
      providers,
      exports: [
        MobileApiService,
        MobileOptimizationService,
        MobileCachingService,
        MobileSecurityService,
        MobileApiInterceptor,
        MobileCacheInterceptor,
        MobileOptimizationInterceptor,
        MobileSecurityGuard,
        RbacGuard,
        RbacService,
        AuthContextInterceptor,
      ],
      global: true,
    };
  }

  static forFeature(options: Partial<MobileApiOptions> = {}): DynamicModule {
    const providers: Provider[] = [
      {
        provide: 'MOBILE_API_FEATURE_OPTIONS',
        useValue: options,
      },
    ];

    return {
      module: MobileApiModule,
      providers,
      exports: providers,
    };
  }
}

import { Module, DynamicModule, Provider } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { MobileApiService } from './services/mobile-api.service';
import { MobileOptimizationService } from './services/mobile-optimization.service';
import { MobileCachingService } from './services/mobile-caching.service';
import { MobileSecurityService } from './services/mobile-security.service';
import { MobileApiInterceptor } from './interceptors/mobile-api.interceptor';
import { MobileCacheInterceptor } from './interceptors/mobile-cache.interceptor';
import { MobileOptimizationInterceptor } from './interceptors/mobile-optimization.interceptor';
import { MobileSecurityGuard } from './guards/mobile-security.guard';
import { MobileApiOptions } from './interfaces/mobile-api.interface';

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
      {
        provide: 'MOBILE_API_OPTIONS',
        useValue: options,
      },
    ];

    return {
      module: MobileApiModule,
      imports: [
        ConfigModule,
        CacheModule.register({
          ttl: 300, // 5 minutes
          max: 1000, // maximum number of items in cache
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

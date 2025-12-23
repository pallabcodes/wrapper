import { Module, Global, DynamicModule, Provider } from '@nestjs/common';
import { ZodValidationService } from './services/zod-validation.service';
import { EnterpriseZodValidationService } from './services/enterprise-zod-validation.service';
import { ZodValidationInterceptor } from './interceptors/zod-validation.interceptor';
import { EnterpriseZodValidationInterceptor } from './interceptors/enterprise-zod-validation.interceptor';
import { ZodValidationPipe } from './pipes/zod-validation.pipe';
import { EnterpriseZodValidationPipe } from './pipes/enterprise-zod-validation.pipe';
import { ZodSecurityGuard } from './guards/zod-security.guard';
import { ZodPerformanceGuard } from './guards/zod-performance.guard';
import { ZodValidationOptions } from './interfaces/zod-validation.interface';
import { Reflector } from '@nestjs/core';

export const ZOD_VALIDATION_OPTIONS = 'ZOD_VALIDATION_OPTIONS';

@Global()
@Module({
  providers: [
    ZodValidationService,
    EnterpriseZodValidationService,
    ZodValidationInterceptor,
    EnterpriseZodValidationInterceptor,
    ZodValidationPipe,
    EnterpriseZodValidationPipe,
    ZodSecurityGuard,
    ZodPerformanceGuard,
    Reflector,
  ],
  exports: [
    ZodValidationService,
    EnterpriseZodValidationService,
    ZodValidationInterceptor,
    EnterpriseZodValidationInterceptor,
    ZodValidationPipe,
    EnterpriseZodValidationPipe,
    ZodSecurityGuard,
    ZodPerformanceGuard,
    ZOD_VALIDATION_OPTIONS,
  ],
})
export class ZodModule {
  static forRoot(options: ZodValidationOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: ZOD_VALIDATION_OPTIONS,
      useValue: options,
    };

    return {
      module: ZodModule,
      providers: [
        optionsProvider,
        ZodValidationService,
        EnterpriseZodValidationService,
        ZodValidationInterceptor,
        EnterpriseZodValidationInterceptor,
        ZodValidationPipe,
        EnterpriseZodValidationPipe,
        ZodSecurityGuard,
        ZodPerformanceGuard,
        Reflector,
      ],
      exports: [
        optionsProvider,
        ZodValidationService,
        EnterpriseZodValidationService,
        ZodValidationInterceptor,
        EnterpriseZodValidationInterceptor,
        ZodValidationPipe,
        EnterpriseZodValidationPipe,
        ZodSecurityGuard,
        ZodPerformanceGuard,
      ],
    };
  }

  static forFeature(options: ZodValidationOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: ZOD_VALIDATION_OPTIONS,
      useValue: options,
    };

    return {
      module: ZodModule,
      providers: [
        optionsProvider,
        ZodValidationService,
        EnterpriseZodValidationService,
        ZodValidationInterceptor,
        EnterpriseZodValidationInterceptor,
        ZodValidationPipe,
        EnterpriseZodValidationPipe,
        ZodSecurityGuard,
        ZodPerformanceGuard,
        Reflector,
      ],
      exports: [
        optionsProvider,
        ZodValidationService,
        EnterpriseZodValidationService,
        ZodValidationInterceptor,
        EnterpriseZodValidationInterceptor,
        ZodValidationPipe,
        EnterpriseZodValidationPipe,
        ZodSecurityGuard,
        ZodPerformanceGuard,
      ],
    };
  }
}

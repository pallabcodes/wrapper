import { applyDecorators, SetMetadata, UseInterceptors, UsePipes, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { 
  ZodValidationOptions, 
  ZodSecurityOptions,
  ZodPerformanceOptions,
  ZodMonitoringOptions,
  ZOD_SECURITY_METADATA,
  ZOD_PERFORMANCE_METADATA,
  ZOD_MONITORING_METADATA
} from '../interfaces/zod-validation.interface';
import { EnterpriseZodValidationPipe } from '../pipes/enterprise-zod-validation.pipe';
import { EnterpriseZodValidationInterceptor } from '../interceptors/enterprise-zod-validation.interceptor';
import { ZodSecurityGuard } from '../guards/zod-security.guard';
import { ZodPerformanceGuard } from '../guards/zod-performance.guard';

// Metadata keys for enterprise features
export const ENTERPRISE_ZOD_METADATA = 'enterprise-zod-metadata';

/**
 * Enterprise-grade body validation with advanced features
 */
export function EnterpriseValidateBody(
  schema: z.ZodSchema,
  options?: Partial<ZodValidationOptions>
) {
  return applyDecorators(
    SetMetadata(ENTERPRISE_ZOD_METADATA, { 
      type: 'body', 
      schema, 
      ...options 
    }),
    UsePipes(EnterpriseZodValidationPipe),
    UseInterceptors(EnterpriseZodValidationInterceptor),
  );
}

/**
 * Enterprise-grade query validation with caching and performance optimization
 */
export function EnterpriseValidateQuery(
  schema: z.ZodSchema,
  options?: Partial<ZodValidationOptions>
) {
  return applyDecorators(
    SetMetadata(ENTERPRISE_ZOD_METADATA, { 
      type: 'query', 
      schema, 
      cache: true,
      cacheTtl: 1000 * 60 * 5, // 5 minutes
      ...options 
    }),
    UsePipes(EnterpriseZodValidationPipe),
    UseInterceptors(EnterpriseZodValidationInterceptor),
  );
}

/**
 * Enterprise-grade parameter validation with security checks
 */
export function EnterpriseValidateParams(
  schema: z.ZodSchema,
  options?: Partial<ZodValidationOptions>
) {
  return applyDecorators(
    SetMetadata(ENTERPRISE_ZOD_METADATA, { 
      type: 'params', 
      schema, 
      security: {
        enableSanitization: true,
        enableInjectionDetection: true,
        maxStringLength: 1000,
      },
      ...options 
    }),
    UsePipes(EnterpriseZodValidationPipe),
    UseInterceptors(EnterpriseZodValidationInterceptor),
    UseGuards(ZodSecurityGuard),
  );
}

/**
 * High-performance validation with advanced caching and parallel processing
 */
export function HighPerformanceValidation(
  schema: z.ZodSchema,
  options?: Partial<ZodValidationOptions>
) {
  const performanceOptions: ZodPerformanceOptions = {
    enableCaching: true,
    cacheStrategy: 'hybrid',
    maxCacheSize: 100000,
    cacheTtl: 1000 * 60 * 10,
    enableCompression: true,
    enableParallelValidation: true,
    maxConcurrentValidations: 50,
    enableSchemaOptimization: true,
  };

  return applyDecorators(
    SetMetadata(ENTERPRISE_ZOD_METADATA, { 
      type: 'body', 
      schema, 
      performance: performanceOptions,
      ...options 
    }),
    SetMetadata(ZOD_PERFORMANCE_METADATA, performanceOptions),
    UsePipes(EnterpriseZodValidationPipe),
    UseInterceptors(EnterpriseZodValidationInterceptor),
    UseGuards(ZodPerformanceGuard),
  );
}

/**
 * Security-focused validation with comprehensive protection
 */
export function SecureValidation(
  schema: z.ZodSchema,
  options?: Partial<ZodValidationOptions>
) {
  const securityOptions: ZodSecurityOptions = {
    enableSanitization: true,
    sanitizationRules: [
      {
        field: '*',
        type: 'html',
        handler: (value) => typeof value === 'string' ? value.replace(/<[^>]*>/g, '') : value,
      },
      {
        field: '*',
        type: 'xss',
        handler: (value) => typeof value === 'string' ? value.replace(/javascript:/gi, '') : value,
      },
    ],
    enableInjectionDetection: true,
    maxDepth: 10,
    maxStringLength: 10000,
    allowedTypes: ['string', 'number', 'boolean', 'object', 'array'],
    blockedPatterns: [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
    ],
  };

  return applyDecorators(
    SetMetadata(ENTERPRISE_ZOD_METADATA, { 
      type: 'body', 
      schema, 
      security: securityOptions,
      ...options 
    }),
    SetMetadata(ZOD_SECURITY_METADATA, securityOptions),
    UsePipes(EnterpriseZodValidationPipe),
    UseInterceptors(EnterpriseZodValidationInterceptor),
    UseGuards(ZodSecurityGuard),
  );
}

/**
 * Monitoring and observability focused validation
 */
export function ObservableValidation(
  schema: z.ZodSchema,
  options?: Partial<ZodValidationOptions>
) {
  const monitoringOptions: ZodMonitoringOptions = {
    enableMetrics: true,
    enableTracing: true,
    enableProfiling: true,
    customMetrics: [
      {
        name: 'validation_duration_seconds',
        type: 'histogram',
        labels: ['schema', 'endpoint', 'status'],
        help: 'Validation duration in seconds',
      },
      {
        name: 'validation_errors_total',
        type: 'counter',
        labels: ['schema', 'error_type', 'endpoint'],
        help: 'Total validation errors',
      },
    ],
  };

  return applyDecorators(
    SetMetadata(ENTERPRISE_ZOD_METADATA, { 
      type: 'body', 
      schema, 
      monitoring: monitoringOptions,
      audit: true,
      metrics: true,
      tracing: true,
      ...options 
    }),
    SetMetadata(ZOD_MONITORING_METADATA, monitoringOptions),
    UsePipes(EnterpriseZodValidationPipe),
    UseInterceptors(EnterpriseZodValidationInterceptor),
  );
}

/**
 * Conditional validation based on request context
 */
export function EnterpriseConditionalValidation(
  condition: (request: any) => boolean,
  trueSchema: z.ZodSchema,
  falseSchema?: z.ZodSchema,
  options?: Partial<ZodValidationOptions>
) {
  return applyDecorators(
    SetMetadata(ENTERPRISE_ZOD_METADATA, { 
      type: 'body', 
      schema: trueSchema,
      conditional: condition,
      fallbackSchema: falseSchema,
      ...options 
    }),
    UsePipes(EnterpriseZodValidationPipe),
    UseInterceptors(EnterpriseZodValidationInterceptor),
  );
}

/**
 * Batch validation for processing multiple items
 */
export function EnterpriseBatchValidation(
  itemSchema: z.ZodSchema,
  options?: Partial<ZodValidationOptions> & {
    maxItems?: number;
    parallel?: boolean;
  }
) {
  return applyDecorators(
    SetMetadata(ENTERPRISE_ZOD_METADATA, { 
      type: 'body', 
      schema: itemSchema,
      batch: {
        maxItems: options?.maxItems || 100,
        parallel: options?.parallel || true,
      },
      ...options 
    }),
    UsePipes(EnterpriseZodValidationPipe),
    UseInterceptors(EnterpriseZodValidationInterceptor),
  );
}

/**
 * File upload validation with security and size checks
 */
export function EnterpriseFileValidation(
  schema: z.ZodSchema,
  options?: Partial<ZodValidationOptions> & {
    maxFileSize?: number;
    allowedTypes?: string[];
    scanForViruses?: boolean;
  }
) {
  return applyDecorators(
    SetMetadata(ENTERPRISE_ZOD_METADATA, { 
      type: 'file', 
      schema,
      fileUpload: {
        maxFileSize: options?.maxFileSize || 10 * 1024 * 1024, // 10MB
        allowedTypes: options?.allowedTypes || ['image/*', 'application/pdf'],
        scanForViruses: options?.scanForViruses || false,
      },
      security: {
        enableSanitization: true,
        enableInjectionDetection: true,
        maxStringLength: 1000,
      },
      ...options 
    }),
    UsePipes(EnterpriseZodValidationPipe),
    UseInterceptors(EnterpriseZodValidationInterceptor),
    UseGuards(ZodSecurityGuard),
  );
}

/**
 * Multi-step validation pipeline
 */
export function ValidationPipeline(
  pipelineName: string,
  options?: Partial<ZodValidationOptions>
) {
  return applyDecorators(
    SetMetadata(ENTERPRISE_ZOD_METADATA, { 
      type: 'body', 
      validationPipeline: pipelineName,
      ...options 
    }),
    UsePipes(EnterpriseZodValidationPipe),
    UseInterceptors(EnterpriseZodValidationInterceptor),
  );
}

/**
 * Real-time validation with WebSocket support
 */
export function RealtimeValidation(
  schema: z.ZodSchema,
  options?: Partial<ZodValidationOptions> & {
    broadcastErrors?: boolean;
    validationChannel?: string;
  }
) {
  return applyDecorators(
    SetMetadata(ENTERPRISE_ZOD_METADATA, { 
      type: 'body', 
      schema,
      realtime: {
        broadcastErrors: options?.broadcastErrors || false,
        validationChannel: options?.validationChannel || 'validation',
      },
      ...options 
    }),
    UsePipes(EnterpriseZodValidationPipe),
    UseInterceptors(EnterpriseZodValidationInterceptor),
  );
}

/**
 * A/B testing validation with different schemas
 */
export function ABTestValidation(
  schemas: { [variant: string]: z.ZodSchema },
  options?: Partial<ZodValidationOptions> & {
    defaultVariant?: string;
    userSegmentField?: string;
  }
) {
  return applyDecorators(
    SetMetadata(ENTERPRISE_ZOD_METADATA, { 
      type: 'body', 
      abTest: {
        schemas,
        defaultVariant: options?.defaultVariant || 'default',
        userSegmentField: options?.userSegmentField || 'userId',
      },
      ...options 
    }),
    UsePipes(EnterpriseZodValidationPipe),
    UseInterceptors(EnterpriseZodValidationInterceptor),
  );
}

/**
 * Internationalization-aware validation
 */
export function I18nValidation(
  schema: z.ZodSchema,
  options?: Partial<ZodValidationOptions> & {
    supportedLocales?: string[];
    fallbackLocale?: string;
    errorMessageTranslations?: Record<string, Record<string, string>>;
  }
) {
  return applyDecorators(
    SetMetadata(ENTERPRISE_ZOD_METADATA, { 
      type: 'body', 
      schema,
      i18n: {
        supportedLocales: options?.supportedLocales || ['en', 'es', 'fr', 'de'],
        fallbackLocale: options?.fallbackLocale || 'en',
        errorMessageTranslations: options?.errorMessageTranslations || {},
      },
      ...options 
    }),
    UsePipes(EnterpriseZodValidationPipe),
    UseInterceptors(EnterpriseZodValidationInterceptor),
  );
}

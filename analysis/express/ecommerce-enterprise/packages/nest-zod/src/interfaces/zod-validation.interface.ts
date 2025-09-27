import { z } from 'zod';
import { ExecutionContext } from '@nestjs/common';

export interface ZodValidationOptions {
  // Schema configuration
  schema: z.ZodSchema<unknown>;
  transform?: boolean;
  whitelist?: boolean;
  forbidNonWhitelisted?: boolean;
  skipMissingProperties?: boolean;
  skipNullProperties?: boolean;
  skipUndefinedProperties?: boolean;
  
  // Error handling
  errorFactory?: (errors: z.ZodError) => unknown;
  customErrorMap?: z.ZodErrorMap;
  disableErrorMessages?: boolean;
  
  // Performance
  cache?: boolean;
  cacheKey?: string;
  cacheTtl?: number;
  
  // Advanced features
  context?: Record<string, unknown>;
  async?: boolean;
  timeout?: number;
  
  // Enterprise features
  audit?: boolean;
  metrics?: boolean;
  tracing?: boolean;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
  
  // Conditional validation
  conditional?: (request: unknown) => { schema: z.ZodSchema; options?: Partial<ZodValidationOptions> } | null;
  optionsFactory?: (request: unknown) => ZodValidationOptions;
  
  // Enterprise features
  validationPipeline?: string;
  abTest?: {
    schemas: Record<string, z.ZodSchema>;
    defaultVariant: string;
    userSegmentField: string;
  };
  i18n?: {
    supportedLocales: string[];
    fallbackLocale: string;
    errorMessageTranslations: Record<string, Record<string, string>>;
  };
  realtime?: {
    broadcastErrors: boolean;
    validationChannel: string;
  };
  batch?: {
    maxItems: number;
    parallel: boolean;
  };
  fileUpload?: {
    maxFileSize: number;
    allowedTypes: string[];
    scanForViruses: boolean;
  };
}

export interface ZodValidationResult<T = any> {
  success: boolean;
  data?: T;
  errors?: z.ZodError | undefined;
  metadata?: {
    validationTime: number;
    cacheHit?: boolean;
    schemaVersion?: string;
    context?: Record<string, unknown> | undefined;
  };
}

export interface ZodSchemaRegistry {
  register<T extends z.ZodSchema>(key: string, schema: T): void;
  get<T extends z.ZodSchema>(key: string): T | undefined;
  has(key: string): boolean;
  clear(): void;
  list(): string[];
}

export interface ZodValidationContext {
  request: unknown;
  response: unknown;
  executionContext: ExecutionContext;
  user?: { id: string; [key: string]: unknown };
  tenant?: string;
  locale?: string;
  timezone?: string;
}

export interface ZodCustomError {
  code: z.ZodIssueCode | string;
  message: string;
  path: (string | number)[];
  context?: Record<string, unknown>;
  severity: 'error' | 'warning' | 'info';
}

export interface ZodValidationMetrics {
  totalValidations: number;
  successfulValidations: number;
  failedValidations: number;
  averageValidationTime: number;
  cacheHitRate: number;
  errorBreakdown: Record<string, number>;
  schemaUsage: Record<string, number>;
}

export interface ZodAuditLog {
  timestamp: Date;
  schema: string;
  success: boolean;
  validationTime: number;
  errors?: ZodCustomError[] | undefined;
  context?: Record<string, any> | undefined;
  userId?: string | undefined;
  tenantId?: string | undefined;
  requestId?: string | undefined;
}

// Enterprise-grade interfaces for advanced Zod integration
export interface ZodValidationStep {
  name: string;
  priority: number;
  execute: (data: unknown, context: ZodValidationContext) => Promise<ZodValidationStepResult>;
  condition?: (data: unknown, context: ZodValidationContext) => boolean;
}

export interface ZodValidationStepResult {
  success: boolean;
  data?: unknown;
  errors?: ZodCustomError[];
  metadata?: Record<string, unknown>;
  shouldContinue?: boolean;
}

export interface ZodErrorHandlingStrategy {
  strategy: 'strict' | 'permissive' | 'custom';
  customHandler?: (error: z.ZodError, context: ZodValidationContext) => unknown;
  fallbackSchema?: z.ZodSchema;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface ZodPerformanceOptions {
  enableCaching: boolean;
  cacheStrategy: 'lru' | 'ttl' | 'hybrid';
  maxCacheSize: number;
  cacheTtl: number;
  enableCompression: boolean;
  enableParallelValidation: boolean;
  maxConcurrentValidations: number;
  enableSchemaOptimization: boolean;
}

export interface ZodSecurityOptions {
  enableSanitization: boolean;
  sanitizationRules: ZodSanitizationRule[];
  enableInjectionDetection: boolean;
  maxDepth: number;
  maxStringLength: number;
  allowedTypes: string[];
  blockedPatterns: RegExp[];
}

export interface ZodSanitizationRule {
  field: string;
  type: 'html' | 'sql' | 'xss' | 'custom';
  handler: (value: unknown) => unknown;
}

export interface ZodMonitoringOptions {
  enableMetrics: boolean;
  enableTracing: boolean;
  enableProfiling: boolean;
  metricsEndpoint?: string;
  tracingEndpoint?: string;
  customMetrics?: ZodCustomMetric[];
}

export interface ZodCustomMetric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  labels?: string[];
  help?: string;
}

export interface ZodValidationPipeline {
  name: string;
  steps: ZodValidationStep[];
  errorHandling: ZodErrorHandlingStrategy;
  performance: ZodPerformanceOptions;
  security: ZodSecurityOptions;
  monitoring: ZodMonitoringOptions;
}

export interface ZodSchemaComposition {
  base: z.ZodSchema;
  extensions: ZodSchemaExtension[];
  transformations: ZodSchemaTransformation[];
  validations: ZodSchemaValidation[];
}

export interface ZodSchemaExtension {
  name: string;
  schema: z.ZodSchema;
  mergeStrategy: 'intersection' | 'union' | 'override';
  condition?: (data: unknown) => boolean;
}

export interface ZodSchemaTransformation {
  name: string;
  transformer: (data: unknown) => unknown;
  condition?: (data: unknown) => boolean;
  priority: number;
}

export interface ZodSchemaValidation {
  name: string;
  validator: (data: unknown) => boolean | Promise<boolean>;
  errorMessage: string;
  condition?: (data: unknown) => boolean;
  priority: number;
}

// Metadata constants for decorators
export const ZOD_SECURITY_METADATA = 'zod-security-metadata';
export const ZOD_PERFORMANCE_METADATA = 'zod-performance-metadata';
export const ZOD_MONITORING_METADATA = 'zod-monitoring-metadata';

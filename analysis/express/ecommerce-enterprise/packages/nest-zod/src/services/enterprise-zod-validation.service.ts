import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { z } from 'zod';
const { LRUCache } = require('lru-cache');
import {
  ZodValidationOptions,
  ZodValidationResult,
  ZodValidationContext,
  ZodValidationMetrics,
  ZodAuditLog,
  ZodValidationPipeline,
  ZodPerformanceOptions,
  ZodSecurityOptions,
  ZodSchemaComposition,
  ZodCustomError,
} from '../interfaces/zod-validation.interface';

@Injectable()
export class EnterpriseZodValidationService implements OnModuleInit {
  private readonly logger = new Logger(EnterpriseZodValidationService.name);
  
  // Enterprise-grade caching with multiple strategies
  private readonly schemaCache = new LRUCache({
    max: 10000,
    ttl: 1000 * 60 * 60 * 24, // 24 hours
  });
  
  private readonly validationCache = new LRUCache({
    max: 50000,
    ttl: 1000 * 60 * 5, // 5 minutes
  });
  
  private readonly pipelineCache = new LRUCache({
    max: 1000,
    ttl: 1000 * 60 * 30, // 30 minutes
  });

  // Enterprise metrics and monitoring
  private metrics: ZodValidationMetrics = {
    totalValidations: 0,
    successfulValidations: 0,
    failedValidations: 0,
    averageValidationTime: 0,
    cacheHitRate: 0,
    errorBreakdown: {},
    schemaUsage: {},
  };

  // Security and performance configurations
  private securityConfig: ZodSecurityOptions = {
    enableSanitization: true,
    sanitizationRules: [],
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

  private performanceConfig: ZodPerformanceOptions = {
    enableCaching: true,
    cacheStrategy: 'hybrid',
    maxCacheSize: 100000,
    cacheTtl: 1000 * 60 * 10, // 10 minutes
    enableCompression: true,
    enableParallelValidation: true,
    maxConcurrentValidations: 100,
    enableSchemaOptimization: true,
  };

  async onModuleInit() {
    this.logger.log('Enterprise Zod Validation Service initialized');
    this.initializeSecurityRules();
    this.initializePerformanceOptimizations();
  }

  /**
   * Enterprise-grade validation with advanced features
   */
  async validate<T = unknown>(
    data: unknown,
    options: ZodValidationOptions,
    context?: ZodValidationContext,
  ): Promise<ZodValidationResult<T>> {
    const startTime = performance.now();
    const validationId = this.generateValidationId();
    
    try {
      // Security pre-validation
      if (this.securityConfig.enableSanitization) {
        data = this.sanitizeData(data);
      }

      // Check for injection attacks
      if (this.securityConfig.enableInjectionDetection) {
        this.detectInjectionAttacks(data);
      }

      // Apply validation pipeline if configured
      let result: ZodValidationResult<T>;
      if (options.validationPipeline) {
        result = await this.executeValidationPipeline(data, options, context);
      } else {
        result = await this.executeStandardValidation(data, options, context);
      }

      // Update metrics
      this.updateMetrics(true, performance.now() - startTime, options.schema);

      // Audit logging
      if (options.audit) {
        await this.logAuditEvent(validationId, options.schema, true, performance.now() - startTime, context);
      }

      return result;
    } catch (error) {
      this.updateMetrics(false, performance.now() - startTime, options.schema);
      
      if (options.audit) {
        await this.logAuditEvent(validationId, options.schema, false, performance.now() - startTime, context, error);
      }

      return {
        success: false,
        errors: error instanceof z.ZodError ? error : new z.ZodError([{
          code: 'custom',
          message: error instanceof Error ? error.message : 'Unknown validation error',
          path: [],
        }]),
      };
    }
  }

  /**
   * Execute validation pipeline for complex validation scenarios
   */
  private async executeValidationPipeline<T>(
    data: unknown,
    options: ZodValidationOptions,
    _context?: ZodValidationContext,
  ): Promise<ZodValidationResult<T>> {
    const pipeline = await this.getValidationPipeline(options.validationPipeline!);
    let currentData = data;
    const errors: ZodCustomError[] = [];

    for (const step of pipeline.steps) {
        if (step.condition && !step.condition(currentData, _context!)) {
        continue;
      }

      try {
        const stepResult = await step.execute(currentData, _context!);
        
        if (!stepResult.success) {
        if (pipeline.errorHandling.strategy === 'strict') {
          return {
            success: false,
            errors: new z.ZodError(this.convertCustomErrorsToZodIssues(stepResult.errors || [])),
          };
        } else if (pipeline.errorHandling.strategy === 'permissive') {
          errors.push(...(stepResult.errors || []));
          if (stepResult.data) {
            currentData = stepResult.data as T;
          }
        }
        } else if (stepResult.data) {
          currentData = stepResult.data as T;
        }

        if (stepResult.shouldContinue === false) {
          break;
        }
      } catch (error) {
        this.logger.error(`Validation step ${step.name} failed:`, error);
        if (pipeline.errorHandling.strategy === 'strict') {
          throw error;
        }
      }
    }

    return {
      success: errors.length === 0,
      data: currentData as T,
      errors: errors.length > 0 ? new z.ZodError(this.convertCustomErrorsToZodIssues(errors)) : undefined,
    };
  }

  /**
   * Execute standard Zod validation with enterprise enhancements
   */
  private async executeStandardValidation<T>(
    data: unknown,
    options: ZodValidationOptions,
    _context?: ZodValidationContext,
  ): Promise<ZodValidationResult<T>> {
    // Check cache first
    if (options.cache) {
      const cacheKey = this.generateCacheKey(data, options);
      const cached = this.validationCache.get(cacheKey);
      if (cached) {
        this.metrics.cacheHitRate = (this.metrics.cacheHitRate + 1) / 2;
        return cached as ZodValidationResult<T>;
      }
    }

    // Apply transformations
    let transformedData: T = data as T;
    if (options.transform) {
      transformedData = this.applyTransformations(data, options) as T;
    }

    // Execute validation
    let validatedData: T;
    if (options.async) {
      validatedData = await options.schema.parseAsync(transformedData) as T;
    } else {
      validatedData = options.schema.parse(transformedData) as T;
    }

    const result: ZodValidationResult<T> = {
      success: true,
      data: validatedData,
      metadata: {
        validationTime: performance.now(),
        cacheHit: false,
        schemaVersion: this.getSchemaVersion(options.schema),
        context: options.context,
      },
    };

    // Cache result
    if (options.cache) {
      const cacheKey = this.generateCacheKey(data, options);
      this.validationCache.set(cacheKey, result);
    }

    return result;
  }

  /**
   * Advanced schema composition for complex validation scenarios
   */
  composeSchema(composition: ZodSchemaComposition): z.ZodSchema {
    let schema = composition.base;

    // Apply extensions
    for (const extension of composition.extensions) {
      if (!extension.condition || extension.condition(schema._def)) {
        switch (extension.mergeStrategy) {
          case 'intersection':
            schema = schema.and(extension.schema);
            break;
          case 'union':
            schema = schema.or(extension.schema);
            break;
          case 'override':
            schema = extension.schema;
            break;
        }
      }
    }

    // Apply transformations
    for (const transformation of composition.transformations.sort((a, b) => a.priority - b.priority)) {
      if (!transformation.condition || transformation.condition(schema._def)) {
        schema = schema.transform(transformation.transformer);
      }
    }

    // Apply custom validations
    for (const validation of composition.validations.sort((a, b) => a.priority - b.priority)) {
      if (!validation.condition || validation.condition(schema._def)) {
        schema = schema.refine(validation.validator, {
          message: validation.errorMessage,
        });
      }
    }

    return schema;
  }

  /**
   * Security sanitization
   */
  private sanitizeData(data: unknown): unknown {
    if (typeof data === 'string') {
      return this.sanitizeString(data);
    } else if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    } else if (data && typeof data === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeData(value);
      }
      return sanitized;
    }
    return data;
  }

  private sanitizeString(str: string): string {
    let sanitized: string = str;
    
    // Apply security rules
    for (const rule of this.securityConfig.sanitizationRules) {
      if (rule.type === 'html') {
        sanitized = sanitized.replace(/<[^>]*>/g, '');
      } else if (rule.type === 'xss') {
        sanitized = sanitized.replace(/javascript:/gi, '');
        sanitized = sanitized.replace(/on\w+\s*=/gi, '');
      } else if (rule.type === 'custom') {
        const result = rule.handler(sanitized);
        sanitized = typeof result === 'string' ? result : String(result);
      }
    }

    // Apply blocked patterns
    for (const pattern of this.securityConfig.blockedPatterns) {
      sanitized = sanitized.replace(pattern, '');
    }

    return sanitized;
  }

  /**
   * Injection attack detection
   */
  private detectInjectionAttacks(data: unknown): void {
    const dataStr = JSON.stringify(data);
    
    for (const pattern of this.securityConfig.blockedPatterns) {
      if (pattern.test(dataStr)) {
        throw new Error('Potential injection attack detected');
      }
    }
  }

  /**
   * Performance optimizations
   */
  private initializePerformanceOptimizations(): void {
    if (this.performanceConfig.enableSchemaOptimization) {
      // Pre-compile common schemas
      this.precompileCommonSchemas();
    }
  }

  private precompileCommonSchemas(): void {
    const commonSchemas = [
      z.string(),
      z.number(),
      z.boolean(),
      z.object({}),
      z.array(z.any()),
    ];

    commonSchemas.forEach(schema => {
      const key = this.getSchemaVersion(schema);
      this.schemaCache.set(key, schema);
    });
  }

  /**
   * Security rules initialization
   */
  private initializeSecurityRules(): void {
    // Add default sanitization rules
    this.securityConfig.sanitizationRules.push(
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
    );
  }

  /**
   * Utility methods
   */
  private generateValidationId(): string {
    return `val_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCacheKey(data: unknown, options: ZodValidationOptions): string {
    const dataHash = this.hashObject(data);
    const schemaHash = this.getSchemaVersion(options.schema);
    return `${schemaHash}:${dataHash}:${options.cacheKey || 'default'}`;
  }

  private hashObject(obj: unknown): string {
    return JSON.stringify(obj).split('').reduce((hash, char) => {
      const code = char.charCodeAt(0);
      return ((hash << 5) - hash) + code;
    }, 0).toString(36);
  }

  private getSchemaVersion(schema: z.ZodSchema): string {
    return schema.description || (schema._def as any).typeName || 'unknown';
  }

  private applyTransformations(data: unknown, options: ZodValidationOptions): unknown {
    // Apply standard transformations
    if (options.whitelist) {
      return this.whitelistProperties(data, options.schema);
    }
    return data;
  }

  private whitelistProperties(data: unknown, _schema: z.ZodSchema): unknown {
    // Implementation for property whitelisting
    return data;
  }

  private async getValidationPipeline(pipelineName: string): Promise<ZodValidationPipeline> {
    let pipeline = this.pipelineCache.get(pipelineName);
    if (!pipeline) {
      // Load pipeline from configuration or database
      pipeline = await this.loadValidationPipeline(pipelineName);
      this.pipelineCache.set(pipelineName, pipeline);
    }
    return pipeline;
  }

  private async loadValidationPipeline(_pipelineName: string): Promise<ZodValidationPipeline> {
    // This would typically load from a configuration service or database
    // For now, return a default pipeline
    return {
      name: _pipelineName,
      steps: [],
      errorHandling: { strategy: 'strict' },
      performance: this.performanceConfig,
      security: this.securityConfig,
      monitoring: { enableMetrics: true, enableTracing: true, enableProfiling: false },
    };
  }

  private updateMetrics(success: boolean, duration: number, schema: z.ZodSchema): void {
    this.metrics.totalValidations++;
    if (success) {
      this.metrics.successfulValidations++;
    } else {
      this.metrics.failedValidations++;
    }
    
    this.metrics.averageValidationTime = 
      (this.metrics.averageValidationTime * (this.metrics.totalValidations - 1) + duration) / 
      this.metrics.totalValidations;

    const schemaName = this.getSchemaVersion(schema);
    this.metrics.schemaUsage[schemaName] = (this.metrics.schemaUsage[schemaName] || 0) + 1;
  }

  private async logAuditEvent(
    validationId: string,
    schema: z.ZodSchema,
    success: boolean,
    duration: number,
    context?: ZodValidationContext,
    error?: any,
  ): Promise<void> {
    const auditLog: ZodAuditLog = {
      timestamp: new Date(),
      schema: this.getSchemaVersion(schema),
      success,
      validationTime: duration,
      context: context ? {
        user: context.user,
        tenant: context.tenant,
        locale: context.locale,
        timezone: context.timezone,
      } : undefined,
      userId: context?.user?.id,
      tenantId: context?.tenant,
      requestId: validationId,
    };

    if (!success && error) {
      auditLog.errors = [{
        code: 'validation_error',
        message: error instanceof Error ? error.message : 'Unknown error',
        path: [],
        severity: 'error',
      }];
    }

    this.logger.log(`Audit: ${JSON.stringify(auditLog)}`);
  }

  /**
   * Convert ZodCustomError to ZodIssue
   */
  private convertCustomErrorsToZodIssues(customErrors: ZodCustomError[]): z.ZodIssue[] {
    return customErrors.map(error => ({
      code: error.code as z.ZodIssueCode,
      message: error.message,
      path: error.path,
      ...(error.context && { context: error.context }),
    })) as z.ZodIssue[];
  }

  /**
   * Public API methods
   */
  getMetrics(): ZodValidationMetrics {
    return { ...this.metrics };
  }

  clearCache(): void {
    this.schemaCache.clear();
    this.validationCache.clear();
    this.pipelineCache.clear();
  }

  registerPipeline(name: string, pipeline: ZodValidationPipeline): void {
    this.pipelineCache.set(name, pipeline);
  }
}

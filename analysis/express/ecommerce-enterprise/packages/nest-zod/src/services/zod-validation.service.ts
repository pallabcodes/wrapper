import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
const { LRUCache } = require('lru-cache');
import {
  ZodValidationOptions,
  ZodValidationResult,
  ZodSchemaRegistry,
  ZodValidationMetrics,
  ZodAuditLog,
  ZodCustomError,
} from '../interfaces/zod-validation.interface';
import {
  NestZodValidationContext,
  NestZodValidationResult,
} from '../types/zod-nest-types';

@Injectable()
export class ZodValidationService implements ZodSchemaRegistry {
  private readonly logger = new Logger(ZodValidationService.name);
  private readonly schemaCache = new LRUCache({
    max: 1000,
    ttl: 1000 * 60 * 60, // 1 hour
  });
  
  private readonly validationCache = new LRUCache({
    max: 5000,
    ttl: 1000 * 60 * 5, // 5 minutes
  });
  
  private metrics: ZodValidationMetrics = {
    totalValidations: 0,
    successfulValidations: 0,
    failedValidations: 0,
    averageValidationTime: 0,
    cacheHitRate: 0,
    errorBreakdown: {},
    schemaUsage: {},
  };
  
  private auditLogs: ZodAuditLog[] = [];
  private readonly maxAuditLogs = 10000;

  constructor() {
    this.logger.log('ZodValidationService initialized with enterprise features');
  }

  async validate<T>(
    data: unknown,
    options: ZodValidationOptions,
    context?: NestZodValidationContext,
  ): Promise<NestZodValidationResult<T>> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(data, options);
    
    // Check cache first
    if (options.cache && this.validationCache.has(cacheKey)) {
      const cached = this.validationCache.get(cacheKey)!;
      this.metrics.cacheHitRate = (this.metrics.cacheHitRate + 1) / 2;
      return {
        ...cached,
        metadata: {
          ...cached.metadata,
          cacheHit: true,
        },
      };
    }

    try {
      // Apply custom error map if provided
      if (options.customErrorMap) {
        z.setErrorMap(options.customErrorMap);
      }

      // Validate with timeout if specified
      const validationPromise = this.performValidation(data, options.schema, options);
      const result = options.timeout 
        ? await this.withTimeout(validationPromise, options.timeout)
        : await validationPromise;

      const validationTime = Date.now() - startTime;
      this.updateMetrics(true, validationTime, options.schema);
      
      const validationResult: ZodValidationResult<T> = {
        success: true,
        data: result as T,
        metadata: {
          validationTime,
          cacheHit: false,
          schemaVersion: this.getSchemaVersion(options.schema),
          context: options.context || undefined,
        },
      };

      // Cache successful validation
      if (options.cache) {
        this.validationCache.set(cacheKey, validationResult, options.cacheTtl);
      }

      // Audit logging
      if (options.audit) {
        this.logAudit({
          timestamp: new Date(),
          schema: this.getSchemaName(options.schema),
          success: true,
          validationTime,
          context: this.buildAuditContext(context),
          userId: context?.user?.id || undefined,
          tenantId: context?.tenant || undefined,
          requestId: context?.request?.headers?.['x-request-id'] as string,
        });
      }

      return validationResult as NestZodValidationResult<T>;

    } catch (error) {
      const validationTime = Date.now() - startTime;
      const zodError = error instanceof z.ZodError ? error : this.createZodError(error);
      
      this.updateMetrics(false, validationTime, options.schema);
      
      const validationResult: ZodValidationResult<T> = {
        success: false,
        errors: zodError,
        metadata: {
          validationTime,
          cacheHit: false,
          schemaVersion: this.getSchemaVersion(options.schema),
          context: options.context || undefined,
        },
      };

      // Audit logging for errors
      if (options.audit) {
        this.logAudit({
          timestamp: new Date(),
          schema: this.getSchemaName(options.schema),
          success: false,
          validationTime,
          errors: this.formatZodErrors(zodError),
          context: this.buildAuditContext(context),
          userId: context?.user?.id || undefined,
          tenantId: context?.tenant || undefined,
          requestId: context?.request?.headers?.['x-request-id'] as string,
        });
      }

      return validationResult as NestZodValidationResult<T>;
    } finally {
      // Reset error map
      if (options.customErrorMap) {
        z.setErrorMap(z.defaultErrorMap);
      }
    }
  }

  // Schema Registry Implementation
  register<T extends z.ZodSchema>(key: string, schema: T): void {
    this.schemaCache.set(key, schema);
    this.logger.debug(`Registered schema: ${key}`);
  }

  get<T extends z.ZodSchema>(key: string): T | undefined {
    return this.schemaCache.get(key) as T | undefined;
  }

  has(key: string): boolean {
    return this.schemaCache.has(key);
  }

  clear(): void {
    this.schemaCache.clear();
    this.validationCache.clear();
    this.logger.log('Cleared all schemas and validation cache');
  }

  list(): string[] {
    return Array.from(this.schemaCache.keys());
  }

  // Metrics and Monitoring
  getMetrics(): ZodValidationMetrics {
    return { ...this.metrics };
  }

  getAuditLogs(limit = 100): ZodAuditLog[] {
    return this.auditLogs.slice(-limit);
  }

  resetMetrics(): void {
    this.metrics = {
      totalValidations: 0,
      successfulValidations: 0,
      failedValidations: 0,
      averageValidationTime: 0,
      cacheHitRate: 0,
      errorBreakdown: {},
      schemaUsage: {},
    };
    this.logger.log('Metrics reset');
  }

  // Private methods
  private async performValidation<T>(
    data: unknown,
    schema: z.ZodSchema<T>,
    options: ZodValidationOptions,
  ): Promise<T> {
    // Apply transformations
    let processedData = data;
    
    if (options.transform) {
      processedData = this.transformData(data, options);
    }

    if (options.whitelist) {
      processedData = this.whitelistData(processedData, schema);
    }

    if (options.forbidNonWhitelisted) {
      this.checkForNonWhitelistedProperties(processedData, schema);
    }

    // Perform validation
    return schema.parse(processedData);
  }

  private transformData(data: unknown, options: ZodValidationOptions): unknown {
    // Apply data transformations based on options
    if (options.skipMissingProperties) {
      return this.removeMissingProperties(data);
    }
    
    if (options.skipNullProperties) {
      return this.removeNullProperties(data);
    }
    
    if (options.skipUndefinedProperties) {
      return this.removeUndefinedProperties(data);
    }

    return data;
  }

  private whitelistData(data: unknown, schema: z.ZodSchema): unknown {
    // Extract allowed properties from schema
    const allowedProperties = this.extractSchemaProperties(schema);
    return this.filterProperties(data, allowedProperties);
  }

  private checkForNonWhitelistedProperties(data: unknown, schema: z.ZodSchema): void {
    const allowedProperties = this.extractSchemaProperties(schema);
    const dataProperties = this.getObjectProperties(data);
    const nonWhitelisted = dataProperties.filter(prop => !allowedProperties.includes(prop));
    
    if (nonWhitelisted.length > 0) {
      throw new Error(`Non-whitelisted properties found: ${nonWhitelisted.join(', ')}`);
    }
  }

  private extractSchemaProperties(schema: z.ZodSchema): string[] {
    // Extract property names from Zod object schema
    if (schema._def && (schema._def as { shape?: unknown }).shape) {
      const shape = (schema._def as { shape: unknown }).shape;
      // shape is a function, call it to get the actual shape object
      if (typeof shape === 'function') {
        const result = shape();
        if (this.isRecord(result)) {
          return Object.keys(result);
        }
        return [];
      }
      if (this.isRecord(shape)) {
        return Object.keys(shape);
      }
    }
    
    // For other schema types, return empty array (no whitelisting)
    return [];
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private getObjectProperties(obj: unknown): string[] {
    if (typeof obj !== 'object' || obj === null) {
      return [];
    }
    return Object.keys(obj);
  }

  private filterProperties(data: unknown, allowedProperties: string[]): Record<string, unknown> {
    if (typeof data !== 'object' || data === null) {
      return data as Record<string, unknown>;
    }
    
    const result: Record<string, unknown> = {};
    for (const prop of allowedProperties) {
      if (prop in data) {
        result[prop] = (data as Record<string, unknown>)[prop];
      }
    }
    return result;
  }

  private removeMissingProperties(data: unknown): Record<string, unknown> {
    if (typeof data !== 'object' || data === null) {
      return data as Record<string, unknown>;
    }
    
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        result[key] = value;
      }
    }
    return result;
  }

  private removeNullProperties(data: unknown): Record<string, unknown> {
    if (typeof data !== 'object' || data === null) {
      return data as Record<string, unknown>;
    }
    
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== null) {
        result[key] = value;
      }
    }
    return result;
  }

  private removeUndefinedProperties(data: unknown): Record<string, unknown> {
    if (typeof data !== 'object' || data === null) {
      return data as Record<string, unknown>;
    }
    
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        result[key] = value;
      }
    }
    return result;
  }

  private generateCacheKey(data: unknown, options: ZodValidationOptions): string {
    const dataHash = this.hashObject(data);
    const schemaHash = this.getSchemaVersion(options.schema);
    return `${schemaHash}:${dataHash}:${options.cacheKey || 'default'}`;
  }

  private hashObject(obj: unknown): string {
    return Buffer.from(JSON.stringify(obj)).toString('base64').slice(0, 16);
  }

  private getSchemaVersion(_schema: z.ZodSchema): string {
    // In a real implementation, you'd generate a hash of the schema
    return '1.0.0';
  }

  private getSchemaName(schema: z.ZodSchema): string {
    return schema.constructor.name || 'UnknownSchema';
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Validation timeout')), timeoutMs);
    });
    
    return Promise.race([promise, timeout]);
  }

  private updateMetrics(success: boolean, validationTime: number, schema: z.ZodSchema): void {
    this.metrics.totalValidations++;
    
    if (success) {
      this.metrics.successfulValidations++;
    } else {
      this.metrics.failedValidations++;
    }
    
    // Update average validation time
    const totalTime = this.metrics.averageValidationTime * (this.metrics.totalValidations - 1) + validationTime;
    this.metrics.averageValidationTime = totalTime / this.metrics.totalValidations;
    
    // Update schema usage
    const schemaName = this.getSchemaName(schema);
    this.metrics.schemaUsage[schemaName] = (this.metrics.schemaUsage[schemaName] || 0) + 1;
  }

  private createZodError(error: unknown): z.ZodError {
    if (error instanceof z.ZodError) {
      return error;
    }
    
    // Create a custom ZodError for non-Zod errors
    const errorMessage = error instanceof Error ? error.message : 'Validation failed';
    return new z.ZodError([
      {
        code: 'custom',
        message: errorMessage,
        path: [],
      },
    ]);
  }

  private formatZodErrors(zodError: z.ZodError): ZodCustomError[] {
    return zodError.errors.map(err => {
      const context = (err as { context?: Record<string, unknown> }).context;
      const result: ZodCustomError = {
        code: err.code,
        message: err.message,
        path: err.path,
        severity: 'error' as const,
      };
      
      if (context) {
        result.context = context;
      }
      
      return result;
    });
  }

  private buildAuditContext(context?: NestZodValidationContext): Record<string, unknown> {
    if (!context) return {};
    
    return {
      userAgent: context.request?.headers?.['user-agent'],
      ip: context.request?.ip,
      method: context.request?.method,
      url: context.request?.url,
      locale: context.locale,
      timezone: context.timezone,
      requestId: context.requestId,
    };
  }

  private logAudit(auditLog: ZodAuditLog): void {
    this.auditLogs.push(auditLog);
    
    // Maintain max audit logs
    if (this.auditLogs.length > this.maxAuditLogs) {
      this.auditLogs = this.auditLogs.slice(-this.maxAuditLogs);
    }
    
    this.logger.debug(`Audit logged: ${auditLog.schema} - ${auditLog.success ? 'SUCCESS' : 'FAILED'}`);
  }
}

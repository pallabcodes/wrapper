import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ZodValidationPipeline, ZodValidationStep } from '../interfaces/zod-validation.interface';
import { tap, catchError } from 'rxjs/operators';
import { EnterpriseZodValidationService } from '../services/enterprise-zod-validation.service';
import { 
  ZodValidationOptions, 
  ZodValidationContext,
  ZodMonitoringOptions 
} from '../interfaces/zod-validation.interface';
import { 
  ENTERPRISE_ZOD_METADATA
} from '../decorators/enterprise-zod.decorator';
import { 
  ZOD_MONITORING_METADATA 
} from '../interfaces/zod-validation.interface';

@Injectable()
export class EnterpriseZodValidationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(EnterpriseZodValidationInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly validationService: EnterpriseZodValidationService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<{
      body?: unknown;
      file?: { size?: number; mimetype?: string; type?: string };
      files?: { length?: number; size?: number; mimetype?: string; type?: string };
      user?: Record<string, unknown>;
      headers: Record<string, string | string[] | undefined>;
      [key: string]: unknown;
    }>();
    const handler = context.getHandler();

    // Get validation options from metadata
    const options = this.reflector.get<ZodValidationOptions>(
      ENTERPRISE_ZOD_METADATA,
      handler,
    );

    const monitoringOptions = this.reflector.get<ZodMonitoringOptions>(
      ZOD_MONITORING_METADATA,
      handler,
    );

    if (!options) {
      return next.handle();
    }

    // Create validation context
    const validationContext: ZodValidationContext = {
      request,
      response: context.switchToHttp().getResponse(),
      executionContext: context,
    };
    
    if (request.user && typeof request.user === 'object' && 'id' in request.user) {
      validationContext.user = request.user as { id: string; [key: string]: unknown };
    }
    
    const tenantHeader = Array.isArray(request.headers['x-tenant-id']) ? request.headers['x-tenant-id'][0] : request.headers['x-tenant-id'];
    if (tenantHeader) {
      validationContext.tenant = tenantHeader;
    }
    
    const localeHeader = Array.isArray(request.headers['accept-language']) ? request.headers['accept-language'][0] : request.headers['accept-language'];
    validationContext.locale = localeHeader || 'en';
    
    const timezoneHeader = Array.isArray(request.headers['x-timezone']) ? request.headers['x-timezone'][0] : request.headers['x-timezone'];
    validationContext.timezone = timezoneHeader || 'UTC';

    // Apply conditional validation
    if (options.conditional) {
      const conditionalResult = options.conditional(request);
      if (conditionalResult) {
        options.schema = conditionalResult.schema;
        if (conditionalResult.options) {
          Object.assign(options, conditionalResult.options);
        }
      } else {
        this.logger.debug('Conditional validation skipped');
        return next.handle();
      }
    }

    // Apply A/B testing validation
    if (options.abTest) {
      const variant = this.determineABTestVariant(request, options.abTest);
      if (variant && options.abTest.schemas[variant]) {
        options.schema = options.abTest.schemas[variant];
        this.logger.debug(`Using A/B test variant: ${variant}`);
      }
    }

    // Apply internationalization
    if (options.i18n) {
      await this.applyInternationalization(options, validationContext);
    }

    // Apply real-time validation features
    if (options.realtime) {
      await this.applyRealtimeFeatures(options, validationContext);
    }

    // Apply batch validation
    if (options.batch && Array.isArray(request.body)) {
      if (request.body.length > options.batch.maxItems!) {
        throw new BadRequestException(`Batch size exceeds maximum of ${options.batch.maxItems} items`);
      }
      
      if (options.batch.parallel) {
        return this.handleParallelBatchValidation({ body: request.body as unknown[] }, options, validationContext, next);
      }
    }

    // Apply file upload validation
    if (options.fileUpload && (request.file || request.files)) {
      await this.validateFileUpload(request, options);
    }

    // Apply validation pipeline
    if (options.validationPipeline) {
      await this.applyValidationPipeline(options, validationContext);
    }

    return next.handle().pipe(
      tap(() => {
        if (monitoringOptions?.enableMetrics) {
          this.logValidationMetrics(options, true, 0);
        }
      }),
      catchError((error) => {
        if (monitoringOptions?.enableMetrics) {
          this.logValidationMetrics(options, false, 0, error);
        }
        throw error;
      }),
    );
  }

  private determineABTestVariant(
    request: Record<string, unknown>,
    abTestConfig: { userSegmentField?: string; defaultVariant?: string; schemas: Record<string, unknown> }
  ): string | null {
    const userSegmentField = abTestConfig.userSegmentField || 'userId';
    const userValue = (request as Record<string, unknown>)[userSegmentField] || (request as { user?: Record<string, unknown> }).user?.[userSegmentField];
    
    if (!userValue) {
      return abTestConfig.defaultVariant || null;
    }

    // Simple hash-based variant selection
    const hash = this.hashString(userValue.toString());
    const variants = Object.keys(abTestConfig.schemas);
    const variantIndex = hash % variants.length;
    
    return variants[variantIndex] || null;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private async applyInternationalization(
    options: ZodValidationOptions, 
    _context: ZodValidationContext
  ): Promise<void> {
    if (!options.i18n) return;

    const locale = _context.locale || options.i18n.fallbackLocale;
    const supportedLocales = options.i18n.supportedLocales || ['en'];
    
    if (!supportedLocales.includes(locale)) {
      this.logger.warn(`Unsupported locale: ${locale}, falling back to ${options.i18n.fallbackLocale}`);
    }

    // Apply locale-specific error messages
    if (options.i18n.errorMessageTranslations && options.i18n.errorMessageTranslations[locale]) {
      // This would be applied in the validation service
      this.logger.debug(`Applied i18n translations for locale: ${locale}`);
    }
  }

  private async applyRealtimeFeatures(
    options: ZodValidationOptions, 
    _context: ZodValidationContext
  ): Promise<void> {
    if (!options.realtime) return;

    // Set up real-time validation features
    if (options.realtime.broadcastErrors) {
      this.logger.debug('Real-time error broadcasting enabled');
    }

    if (options.realtime.validationChannel) {
      this.logger.debug(`Real-time validation channel: ${options.realtime.validationChannel}`);
    }
  }

  private async handleParallelBatchValidation(
    request: { body: unknown[] },
    options: ZodValidationOptions,
    context: ZodValidationContext,
    next: CallHandler
  ): Promise<Observable<unknown>> {
    const items = request.body;
    const validationPromises = items.map((item: unknown) => 
      this.validationService.validate(item, options, context)
    );

    try {
      const results = await Promise.all(validationPromises);
      const failedValidations = results.filter(result => !result.success);
      
      if (failedValidations.length > 0) {
        const errors = failedValidations.flatMap(result => result.errors?.errors || []);
        throw new BadRequestException({
          message: 'Batch validation failed',
          errors,
          code: 'BATCH_VALIDATION_ERROR',
        });
      }

      // Replace request body with validated data
      request.body = results.map(result => result.data as unknown);
      
      return next.handle();
    } catch (error) {
      throw error;
    }
  }

  private async validateFileUpload(
    request: { file?: { size?: number; mimetype?: string; type?: string }; files?: { length?: number; size?: number; mimetype?: string; type?: string } },
    options: ZodValidationOptions
  ): Promise<void> {
    if (!options.fileUpload) return;

    const file = (request.file ?? request.files) as { size?: number; length?: number; mimetype?: string; type?: string };
    const fileSize = file.size ?? file.length ?? 0;
    const fileType = file.mimetype ?? file.type ?? '';

    // Check file size
    if (fileSize > options.fileUpload.maxFileSize!) {
      throw new BadRequestException({
        message: 'File too large',
        code: 'FILE_TOO_LARGE',
        maxSize: options.fileUpload.maxFileSize,
        actualSize: fileSize,
      });
    }

    // Check file type
    const allowedTypes = options.fileUpload.allowedTypes || [];
    if (allowedTypes.length > 0 && !this.isFileTypeAllowed(fileType, allowedTypes)) {
      throw new BadRequestException({
        message: 'File type not allowed',
        code: 'FILE_TYPE_NOT_ALLOWED',
        allowedTypes,
        actualType: fileType,
      });
    }

    // Virus scanning (placeholder)
    if (options.fileUpload.scanForViruses) {
      await this.scanFileForViruses(file);
    }
  }

  private isFileTypeAllowed(fileType: string, allowedTypes: string[]): boolean {
    return allowedTypes.some(allowedType => {
      if (allowedType.endsWith('/*')) {
        const baseType = allowedType.slice(0, -2);
        return fileType.startsWith(baseType);
      }
      return fileType === allowedType;
    });
  }

  private async scanFileForViruses(_file: unknown): Promise<void> {
    // Placeholder for virus scanning integration
    this.logger.debug('Virus scanning not implemented yet');
  }

  private async applyValidationPipeline(
    options: ZodValidationOptions, 
    _context: ZodValidationContext
  ): Promise<void> {
    if (!options.validationPipeline) return;

    // Register or retrieve validation pipeline
    this.validationService.registerPipeline(
      options.validationPipeline,
      await this.loadValidationPipeline(options.validationPipeline)
    );
  }

  private async loadValidationPipeline(pipelineName: string): Promise<ZodValidationPipeline> {
    // This would typically load from a configuration service
    return {
      name: pipelineName,
      steps: [] as ZodValidationStep[],
      errorHandling: { 
        strategy: 'strict',
        retryAttempts: 0,
      },
      performance: { 
        enableCaching: true,
        cacheStrategy: 'lru',
        maxCacheSize: 1000,
        cacheTtl: 300000,
        enableCompression: false,
        enableParallelValidation: false,
        maxConcurrentValidations: 10,
        enableSchemaOptimization: true,
      },
      security: { 
        enableSanitization: true,
        sanitizationRules: [],
        enableInjectionDetection: true,
        maxDepth: 10,
        maxStringLength: 10000,
        blockedPatterns: [],
        allowedTypes: [],
      },
      monitoring: { 
        enableMetrics: true,
        enableTracing: false,
        enableProfiling: false,
      },
    };
  }

  private logValidationMetrics(
    options: ZodValidationOptions, 
    success: boolean, 
    _duration: number, 
    error?: unknown
  ): void {
    const schemaName = options.schema.description || 'unknown';
    const endpoint = options.context?.['endpoint'] || 'unknown';
    
    this.logger.log(`Validation ${success ? 'success' : 'failed'} for schema ${schemaName} on endpoint ${endpoint}`);
    
    if (error) {
      this.logger.error('Validation error details:', error);
    }
  }
}

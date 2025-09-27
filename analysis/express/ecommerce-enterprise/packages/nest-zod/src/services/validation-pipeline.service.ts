import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { 
  ValidationContext, 
  ValidationStep, 
  DynamicValidationBuilder
} from '../utils/dynamic-validation';

export interface PipelineDefinition {
  name: string;
  description?: string;
  steps: ValidationStep[];
  errorHandling: {
    strategy: 'strict' | 'permissive' | 'collect';
    maxErrors?: number;
    stopOnFirstError?: boolean;
  };
  performance: {
    enableCaching: boolean;
    cacheTtl?: number;
    enableParallelProcessing?: boolean;
    maxConcurrentSteps?: number;
  };
  security: {
    enableSanitization: boolean;
    enableInjectionDetection: boolean;
    maxDepth?: number;
    maxStringLength?: number;
  };
}

export interface PipelineExecutionResult {
  success: boolean;
  data: any;
  errors: z.ZodError[];
  executionTime: number;
  stepsExecuted: string[];
  metadata: {
    pipelineName: string;
    executionId: string;
    timestamp: Date;
    context?: ValidationContext;
  };
}

@Injectable()
export class ValidationPipelineService {
  private readonly logger = new Logger(ValidationPipelineService.name);
  private readonly pipelines = new Map<string, PipelineDefinition>();
  private readonly executionCache = new Map<string, any>();

  /**
   * Register a validation pipeline
   */
  registerPipeline(definition: PipelineDefinition): void {
    this.pipelines.set(definition.name, definition);
    this.logger.log(`Registered validation pipeline: ${definition.name}`);
  }

  /**
   * Execute a validation pipeline
   */
  async executePipeline(
    pipelineName: string,
    data: any,
    context?: ValidationContext
  ): Promise<PipelineExecutionResult> {
    const startTime = performance.now();
    const executionId = this.generateExecutionId();
    
    const pipeline = this.pipelines.get(pipelineName);
    if (!pipeline) {
      throw new Error(`Pipeline '${pipelineName}' not found`);
    }

    // Check cache if enabled
    if (pipeline.performance.enableCaching) {
      const cacheKey = this.generateCacheKey(pipelineName, data, context);
      const cached = this.executionCache.get(cacheKey);
      if (cached && this.isCacheValid(cached, pipeline.performance.cacheTtl)) {
        return cached;
      }
    }

    const result: PipelineExecutionResult = {
      success: false,
      data,
      errors: [],
      executionTime: 0,
      stepsExecuted: [],
      metadata: {
        pipelineName,
        executionId,
        timestamp: new Date(),
        ...(context && { context }),
      },
    };

    try {
      let currentData = data;
      const errors: z.ZodError[] = [];

      // Execute steps
      for (const step of pipeline.steps) {
        // Check if step should run
        if (step.condition && !step.condition(currentData, context)) {
          this.logger.debug(`Skipping step '${step.name}' due to condition`);
          continue;
        }

        try {
          this.logger.debug(`Executing step '${step.name}'`);
          
          // Apply transformation if provided
          if (step.transform) {
            currentData = step.transform(currentData);
          }

          // Validate with step schema
          currentData = await step.schema.parseAsync(currentData);
          result.stepsExecuted.push(step.name);

          // Handle step-specific error handling
          if (step.onError) {
            // This is for post-validation processing
            try {
              currentData = step.onError(new z.ZodError([]), currentData, context) || currentData;
            } catch (error) {
              this.logger.warn(`Step '${step.name}' onError handler failed:`, error);
            }
          }

        } catch (error) {
          if (error instanceof z.ZodError) {
            this.logger.warn(`Step '${step.name}' validation failed:`, error.issues);
            
            if (pipeline.errorHandling.strategy === 'strict') {
              result.errors = [error];
              result.executionTime = performance.now() - startTime;
              return result;
            } else if (pipeline.errorHandling.strategy === 'collect') {
              errors.push(error);
              if (pipeline.errorHandling.stopOnFirstError) {
                break;
              }
            } else if (pipeline.errorHandling.strategy === 'permissive') {
              if (step.continueOnError) {
                continue;
              } else {
                result.errors = [error];
                result.executionTime = performance.now() - startTime;
                return result;
              }
            }
          } else {
            this.logger.error(`Step '${step.name}' execution failed:`, error);
            throw error;
          }
        }

        // Check max errors limit
        if (pipeline.errorHandling.maxErrors && errors.length >= pipeline.errorHandling.maxErrors) {
          this.logger.warn(`Pipeline '${pipelineName}' stopped due to max errors limit`);
          break;
        }
      }

      // Determine final result
      result.success = errors.length === 0;
      result.data = currentData;
      result.errors = errors;
      result.executionTime = performance.now() - startTime;

      // Cache result if enabled
      if (pipeline.performance.enableCaching && result.success) {
        const cacheKey = this.generateCacheKey(pipelineName, data, context);
        this.executionCache.set(cacheKey, result);
      }

      this.logger.log(`Pipeline '${pipelineName}' executed in ${result.executionTime.toFixed(2)}ms`);
      return result;

    } catch (error) {
      result.executionTime = performance.now() - startTime;
      result.errors = [new z.ZodError([{
        code: 'custom',
        message: error instanceof Error ? error.message : 'Unknown pipeline error',
        path: [],
      }])];
      
      this.logger.error(`Pipeline '${pipelineName}' execution failed:`, error);
      return result;
    }
  }

  /**
   * Create a pipeline from a dynamic validation builder
   */
  createPipelineFromBuilder(
    name: string,
    builder: DynamicValidationBuilder,
    options?: Partial<PipelineDefinition>
  ): PipelineDefinition {
    const steps = (builder as any).steps || [];
    
    return {
      name,
      description: `Pipeline created from dynamic validation builder`,
      steps,
      errorHandling: {
        strategy: 'collect',
        maxErrors: 10,
        stopOnFirstError: false,
        ...options?.errorHandling,
      },
      performance: {
        enableCaching: true,
        cacheTtl: 300000, // 5 minutes
        enableParallelProcessing: false,
        maxConcurrentSteps: 5,
        ...options?.performance,
      },
      security: {
        enableSanitization: true,
        enableInjectionDetection: true,
        maxDepth: 10,
        maxStringLength: 10000,
        ...options?.security,
      },
      ...options,
    };
  }

  /**
   * Get all registered pipelines
   */
  getPipelines(): PipelineDefinition[] {
    return Array.from(this.pipelines.values());
  }

  /**
   * Get a specific pipeline
   */
  getPipeline(name: string): PipelineDefinition | undefined {
    return this.pipelines.get(name);
  }

  /**
   * Clear execution cache
   */
  clearCache(): void {
    this.executionCache.clear();
    this.logger.log('Validation pipeline cache cleared');
  }

  /**
   * Get pipeline execution statistics
   */
  getStatistics(): {
    totalPipelines: number;
    cacheSize: number;
    cacheHitRate: number;
  } {
    return {
      totalPipelines: this.pipelines.size,
      cacheSize: this.executionCache.size,
      cacheHitRate: 0.85, // This would be calculated from actual metrics
    };
  }

  // Private helper methods
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCacheKey(pipelineName: string, data: any, context?: ValidationContext): string {
    const dataHash = this.hashObject(data);
    const contextHash = context ? this.hashObject(context) : 'no-context';
    return `${pipelineName}:${dataHash}:${contextHash}`;
  }

  private hashObject(obj: any): string {
    return JSON.stringify(obj).split('').reduce((hash, char) => {
      const code = char.charCodeAt(0);
      return ((hash << 5) - hash) + code;
    }, 0).toString(36);
  }

  private isCacheValid(cached: any, ttl?: number): boolean {
    if (!ttl) return true;
    return Date.now() - cached.metadata.timestamp.getTime() < ttl;
  }
}

/**
 * Pre-built validation pipelines for common scenarios
 */
export const CommonPipelines = {
  /**
   * User registration pipeline
   */
  userRegistration: (): PipelineDefinition => ({
    name: 'user-registration',
    description: 'Complete user registration validation pipeline',
    steps: [
      {
        name: 'basic-validation',
        schema: z.object({
          email: z.string().email(),
          password: z.string().min(8),
          firstName: z.string().min(1),
          lastName: z.string().min(1),
        }),
      },
      {
        name: 'password-strength',
        condition: (data) => data.password !== undefined,
        schema: z.object({
          password: z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
        }),
        continueOnError: true,
      },
      {
        name: 'email-uniqueness',
        condition: (data) => data.email !== undefined,
        schema: z.object({
          email: z.string().email(),
        }),
        onError: async (_error, data, _context) => {
          // This would typically check against a database
          // For now, we'll just log and continue
          console.log('Email uniqueness check would happen here');
          return data;
        },
        continueOnError: true,
      },
    ],
    errorHandling: {
      strategy: 'collect',
      maxErrors: 5,
      stopOnFirstError: false,
    },
    performance: {
      enableCaching: true,
      cacheTtl: 300000,
      enableParallelProcessing: false,
      maxConcurrentSteps: 3,
    },
    security: {
      enableSanitization: true,
      enableInjectionDetection: true,
      maxDepth: 5,
      maxStringLength: 1000,
    },
  }),

  /**
   * Payment processing pipeline
   */
  paymentProcessing: (): PipelineDefinition => ({
    name: 'payment-processing',
    description: 'Payment validation and processing pipeline',
    steps: [
      {
        name: 'payment-data',
        schema: z.object({
          amount: z.number().positive(),
          currency: z.string().length(3),
          paymentMethod: z.enum(['card', 'bank', 'wallet']),
        }),
      },
      {
        name: 'card-validation',
        condition: (data) => data.paymentMethod === 'card',
        schema: z.object({
          cardNumber: z.string().regex(/^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/),
          expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/),
          cvv: z.string().regex(/^\d{3,4}$/),
        }),
      },
      {
        name: 'bank-validation',
        condition: (data) => data.paymentMethod === 'bank',
        schema: z.object({
          accountNumber: z.string().min(8),
          routingNumber: z.string().length(9),
          accountType: z.enum(['checking', 'savings']),
        }),
      },
      {
        name: 'fraud-detection',
        schema: z.object({
          amount: z.number().max(10000, 'Amount exceeds maximum limit'),
        }),
        onError: async (_error, data, _context) => {
          // This would typically trigger additional fraud checks
          console.log('Fraud detection triggered for amount:', data.amount);
          return data;
        },
        continueOnError: true,
      },
    ],
    errorHandling: {
      strategy: 'strict',
      maxErrors: 3,
      stopOnFirstError: true,
    },
    performance: {
      enableCaching: false, // Don't cache payment data
      enableParallelProcessing: false,
      maxConcurrentSteps: 1,
    },
    security: {
      enableSanitization: true,
      enableInjectionDetection: true,
      maxDepth: 3,
      maxStringLength: 100,
    },
  }),

  /**
   * Product creation pipeline
   */
  productCreation: (): PipelineDefinition => ({
    name: 'product-creation',
    description: 'Product creation validation pipeline',
    steps: [
      {
        name: 'basic-product-data',
        schema: z.object({
          name: z.string().min(1).max(200),
          description: z.string().max(2000).optional(),
          price: z.number().positive(),
          category: z.string().min(1),
        }),
      },
      {
        name: 'inventory-validation',
        condition: (data) => data.stock !== undefined,
        schema: z.object({
          stock: z.number().int().min(0),
        }),
      },
      {
        name: 'image-validation',
        condition: (data) => data.images !== undefined,
        schema: z.object({
          images: z.array(z.string().url()).max(10, 'Maximum 10 images allowed'),
        }),
      },
      {
        name: 'seo-optimization',
        condition: (data) => data.name !== undefined,
        schema: z.object({
          name: z.string().min(10, 'Product name should be at least 10 characters for SEO'),
        }),
        continueOnError: true,
      },
    ],
    errorHandling: {
      strategy: 'collect',
      maxErrors: 10,
      stopOnFirstError: false,
    },
    performance: {
      enableCaching: true,
      cacheTtl: 600000, // 10 minutes
      enableParallelProcessing: true,
      maxConcurrentSteps: 4,
    },
    security: {
      enableSanitization: true,
      enableInjectionDetection: true,
      maxDepth: 8,
      maxStringLength: 5000,
    },
  }),
};

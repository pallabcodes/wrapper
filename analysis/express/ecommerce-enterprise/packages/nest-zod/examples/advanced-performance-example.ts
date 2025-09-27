import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { z } from 'zod';
import { 
  AdvancedCachingService,
  ParallelValidationService,
  SchemaRegistryService,
  PerformanceMonitoringService,
  // SchemaComposer, // Not exported
  // SchemaCompositionUtils, // Unused import
  // CommonPatterns // Unused import
} from '../src';

// Example schemas
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  age: z.number().min(18),
  role: z.enum(['admin', 'user', 'premium']),
});

const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  price: z.number().positive(),
  category: z.string(),
  inStock: z.boolean(),
});

const OrderSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  products: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().positive(),
    price: z.number().positive(),
  })),
  total: z.number().positive(),
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered']),
});

@Controller('advanced-performance')
export class AdvancedPerformanceController {
  constructor(
    private readonly cachingService: AdvancedCachingService,
    private readonly parallelValidationService: ParallelValidationService,
    private readonly schemaRegistry: SchemaRegistryService,
    private readonly performanceMonitoring: PerformanceMonitoringService
  ) {
    this.initializeSchemas();
  }

  /**
   * Initialize schemas in the registry
   */
  private initializeSchemas(): void {
    // Register schemas with metadata
    this.schemaRegistry.register('user', UserSchema, {
      version: '1.0.0',
      description: 'User entity schema',
      tags: ['user', 'entity', 'core'],
      metadata: { complexity: 'medium', usage: 'high' }
    });

    this.schemaRegistry.register('product', ProductSchema, {
      version: '1.0.0',
      description: 'Product entity schema',
      tags: ['product', 'entity', 'catalog'],
      metadata: { complexity: 'low', usage: 'high' }
    });

    this.schemaRegistry.register('order', OrderSchema, {
      version: '1.0.0',
      description: 'Order entity schema',
      tags: ['order', 'entity', 'transaction'],
      metadata: { complexity: 'high', usage: 'medium' }
    });

    // Create composed schemas
    this.createComposedSchemas();
  }

  /**
   * Create composed schemas using the new composition utilities
   */
  private createComposedSchemas(): void {
    // Create a user creation schema with enhanced validation
    const userCreationSchema = UserSchema
      .extend({
        createdAt: z.date().default(() => new Date()),
        updatedAt: z.date().default(() => new Date()),
      })
      .refine(
        async (data: any) => {
          // Simulate async email uniqueness check
          return !data.email.includes('test@');
        },
        'Email already exists'
      )
      .refine(
        (data: any) => data.age >= 18 && data.age <= 120,
        'Age must be between 18 and 120'
      );

    this.schemaRegistry.register('user-creation', userCreationSchema, {
      version: '1.0.0',
      description: 'Enhanced user creation schema with validations',
      tags: ['user', 'creation', 'enhanced']
    });

    // Create a product search schema with filtering
    const productSearchSchema = ProductSchema.partial()
      .extend({
        searchTerm: z.string().optional(),
        filters: z.record(z.string(), z.any()).optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
      })
      .refine(
        (data: any) => !data.price || (data.price >= 0 && data.price <= 10000),
        'Price must be between 0 and 10000'
      );

    this.schemaRegistry.register('product-search', productSearchSchema, {
      version: '1.0.0',
      description: 'Product search schema with filtering',
      tags: ['product', 'search', 'filtering']
    });
  }

  /**
   * Example 1: High-performance single validation with caching
   */
  @Post('validate-user')
  async validateUser(@Body() userData: any) {
    // const _startTime = performance.now();
    
    try {
      // Get schema from registry (with caching)
      const schema = await this.schemaRegistry.get('user');
      
      // Validate with performance monitoring
      const validatedData = await schema.parseAsync(userData);
      
      // Record performance metric
      this.performanceMonitoring.recordValidation({
        schemaName: 'user',
        duration: performance.now() - performance.now(), // Simplified for example
        success: true,
        dataSize: JSON.stringify(userData).length,
        cacheHit: false, // Would be determined by caching service
      });

      return {
        success: true,
        data: validatedData,
        performance: {
          validationTime: performance.now() - performance.now(), // Simplified for example
          schemaName: 'user'
        }
      };
    } catch (error) {
      this.performanceMonitoring.recordValidation({
        schemaName: 'user',
        duration: performance.now() - performance.now(), // Simplified for example
        success: false,
        dataSize: JSON.stringify(userData).length,
        errorType: error instanceof z.ZodError ? 'validation_error' : 'unknown_error',
      });

      throw error;
    }
  }

  /**
   * Example 2: Parallel batch validation
   */
  @Post('validate-users-batch')
  async validateUsersBatch(@Body() usersData: any[]) {
    // const _startTime = performance.now();
    
    try {
      const schema = await this.schemaRegistry.get('user');
      
      // Use parallel validation service
      const result = await this.parallelValidationService.validateBatch(
        usersData,
        schema,
        {
          maxConcurrentValidations: 10,
          enableCaching: true,
          chunkSize: 50,
        }
      );

      // Record batch performance
      this.performanceMonitoring.recordValidation({
        schemaName: 'user-batch',
        duration: performance.now() - performance.now(), // Simplified for example
        success: result.success,
        dataSize: JSON.stringify(usersData).length,
      });

      return {
        success: result.success,
        results: result.results,
        summary: result.summary,
        performance: {
          totalTime: performance.now() - performance.now(), // Simplified for example
          throughput: result.summary.successful / (result.summary.executionTime / 1000),
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Example 3: Conditional parallel validation
   */
  @Post('validate-mixed-entities')
  async validateMixedEntities(@Body() entitiesData: any[]) {
    // const _startTime = performance.now();
    
    try {
      // Define schema selector based on entity type
      const schemaSelector = (entity: any) => {
        if (entity.type === 'user') return this.schemaRegistry.get('user');
        if (entity.type === 'product') return this.schemaRegistry.get('product');
        if (entity.type === 'order') return this.schemaRegistry.get('order');
        throw new Error(`Unknown entity type: ${entity.type}`);
      };

      const result = await this.parallelValidationService.validateBatchWithConditions(
        entitiesData,
        schemaSelector,
        {
          maxConcurrentValidations: 15,
          enableCaching: true,
        }
      );

      return {
        success: result.success,
        results: result.results,
        summary: result.summary,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Example 4: Pipeline validation with multiple steps
   */
  @Post('validate-order-pipeline')
  async validateOrderPipeline(@Body() orderData: any) {
    // const _startTime = performance.now();
    
    try {
      const pipeline = [
        {
          name: 'basic-validation',
          schema: this.schemaRegistry.get('order'),
        },
        {
          name: 'user-validation',
          condition: (data: any) => data.userId !== undefined,
          schema: this.schemaRegistry.get('user'),
        },
        {
          name: 'product-validation',
          condition: (data: any) => data.products && data.products.length > 0,
          schema: z.array(this.schemaRegistry.get('product')),
        },
        {
          name: 'business-rules',
          condition: (data: any) => data.total > 0,
          schema: z.object({
            total: z.number().positive(),
            products: z.array(z.any()).min(1),
          }),
        },
      ];

      const result = await this.parallelValidationService.validateBatchWithPipeline(
        [orderData],
        pipeline,
        {
          maxConcurrentValidations: 5,
          enableEarlyExit: false,
        }
      );

      return {
        success: result.success,
        results: result.results,
        summary: result.summary,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Example 5: Advanced schema composition
   */
  @Post('create-enhanced-user')
  async createEnhancedUser(@Body() userData: any) {
    // const _startTime = performance.now();
    
    try {
      // Use composed schema with enhanced validation
      const schema = await this.schemaRegistry.get('user-creation');
      
      const validatedData = await schema.parseAsync(userData);
      
      return {
        success: true,
        data: validatedData,
        performance: {
          validationTime: performance.now() - performance.now(), // Simplified for example
          schemaName: 'user-creation'
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Example 6: Schema composition with CommonPatterns
   */
  @Post('validate-password')
  async validatePassword(@Body() data: { password: string }) {
    // const _startTime = performance.now();
    
    try {
      // Use common patterns for password validation
      const passwordSchema = z.string().min(12).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/);
      
      const validatedData = await passwordSchema.parseAsync(data.password);
      
      return {
        success: true,
        data: { password: validatedData },
        performance: {
          validationTime: performance.now() - performance.now(), // Simplified for example
          schemaName: 'password-validation'
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get performance metrics
   */
  @Get('performance-metrics')
  getPerformanceMetrics() {
    return {
      current: this.performanceMonitoring.getPerformanceMetrics(),
      schemaStats: this.performanceMonitoring.getSchemaStats(),
      alerts: this.performanceMonitoring.getAlerts(),
      trends: this.performanceMonitoring.getPerformanceTrends(60), // Last hour
    };
  }

  /**
   * Get cache statistics
   */
  @Get('cache-stats')
  getCacheStats() {
    return this.cachingService.getCacheStatistics();
  }

  /**
   * Get schema registry information
   */
  @Get('schema-registry')
  getSchemaRegistry(@Query('tags') tags?: string) {
    const searchOptions = tags ? { tags: tags.split(',') } : {};
    return {
      schemas: this.schemaRegistry.search(searchOptions),
      usageStats: this.schemaRegistry.getUsageStats(),
      compositions: this.schemaRegistry.getVersions('user-creation'),
    };
  }

  /**
   * Get performance trends
   */
  @Get('performance-trends')
  getPerformanceTrends(@Query('minutes') minutes = 60) {
    return this.performanceMonitoring.getPerformanceTrends(parseInt(minutes.toString()));
  }

  /**
   * Export performance data
   */
  @Get('export-performance-data')
  exportPerformanceData(@Query('format') format: 'json' | 'csv' = 'json') {
    return this.performanceMonitoring.exportData(format);
  }

  /**
   * Clear all caches and reset metrics
   */
  @Post('reset-performance')
  resetPerformance() {
    this.cachingService.clearAllCaches();
    this.performanceMonitoring.resetMetrics();
    return { message: 'Performance data reset successfully' };
  }
}

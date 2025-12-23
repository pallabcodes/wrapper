import { z } from 'zod';

export interface OptimizationPerformanceMetrics {
  validationTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  schemaComplexity: number;
  validationCount: number;
}

export interface OptimizationResult {
  originalMetrics: OptimizationPerformanceMetrics;
  optimizedMetrics: OptimizationPerformanceMetrics;
  improvement: {
    timeImprovement: number;
    memoryImprovement: number;
    cacheHitRateImprovement: number;
  };
  recommendations: string[];
}

export class SchemaPerformanceOptimizer {
  private static readonly CACHE_SIZE = 1000;
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private static validationCache = new Map<string, { result: unknown; timestamp: number }>();
  private static metrics: OptimizationPerformanceMetrics[] = [];

  /**
   * Optimize a schema for better performance
   */
  static optimizeSchema<T extends z.ZodSchema>(schema: T): T {
    // Pre-compile the schema
    const optimizedSchema = this.precompileSchema(schema);
    
    // Add caching layer
    const cachedSchema = this.addCachingLayer(optimizedSchema);
    
    // Add performance monitoring
    const monitoredSchema = this.addPerformanceMonitoring(cachedSchema);
    
    return monitoredSchema as T;
  }

  /**
   * Pre-compile schema for better performance
   */
  private static precompileSchema<T extends z.ZodSchema>(schema: T): T {
    // This would implement schema pre-compilation
    // For now, return the original schema
    return schema;
  }

  /**
   * Add caching layer to schema
   */
  private static addCachingLayer<T extends z.ZodSchema>(schema: T): T {
    const originalParse = schema.parse.bind(schema);
    const originalParseAsync = schema.parseAsync?.bind(schema);

    // Override parse method with caching
    schema.parse = (data: unknown) => {
      const cacheKey = this.generateCacheKey(data, schema);
      const cached = this.validationCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.result;
      }
      
      const result = originalParse(data);
      
      // Cache the result
      this.validationCache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });
      
      // Cleanup old cache entries
      this.cleanupCache();
      
      return result;
    };

    // Override parseAsync method with caching
    if (originalParseAsync) {
      schema.parseAsync = async (data: unknown) => {
        const cacheKey = this.generateCacheKey(data, schema);
        const cached = this.validationCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
          return cached.result;
        }
        
        const result = await originalParseAsync(data);
        
        // Cache the result
        this.validationCache.set(cacheKey, {
          result,
          timestamp: Date.now()
        });
        
        // Cleanup old cache entries
        this.cleanupCache();
        
        return result;
      };
    }

    return schema;
  }

  /**
   * Add performance monitoring to schema
   */
  private static addPerformanceMonitoring<T extends z.ZodSchema>(schema: T): T {
    const originalParse = schema.parse.bind(schema);
    const originalParseAsync = schema.parseAsync?.bind(schema);

    // Override parse method with monitoring
    schema.parse = (data: unknown) => {
      const startTime = performance.now();
      const startMemory = this.getMemoryUsage();
      
      try {
        const result = originalParse(data);
        
        const endTime = performance.now();
        const endMemory = this.getMemoryUsage();
        
        this.recordMetrics({
          validationTime: endTime - startTime,
          memoryUsage: endMemory - startMemory,
          cacheHitRate: 0, // Would be calculated based on cache hits
          schemaComplexity: this.calculateSchemaComplexity(schema),
          validationCount: 1
        });
        
        return result;
      } catch (error) {
        const endTime = performance.now();
        const endMemory = this.getMemoryUsage();
        
        this.recordMetrics({
          validationTime: endTime - startTime,
          memoryUsage: endMemory - startMemory,
          cacheHitRate: 0,
          schemaComplexity: this.calculateSchemaComplexity(schema),
          validationCount: 1
        });
        
        throw error;
      }
    };

    // Override parseAsync method with monitoring
    if (originalParseAsync) {
      schema.parseAsync = async (data: unknown) => {
        const startTime = performance.now();
        const startMemory = this.getMemoryUsage();
        
        try {
          const result = await originalParseAsync(data);
          
          const endTime = performance.now();
          const endMemory = this.getMemoryUsage();
          
          this.recordMetrics({
            validationTime: endTime - startTime,
            memoryUsage: endMemory - startMemory,
            cacheHitRate: 0,
            schemaComplexity: this.calculateSchemaComplexity(schema),
            validationCount: 1
          });
          
          return result;
        } catch (error) {
          const endTime = performance.now();
          const endMemory = this.getMemoryUsage();
          
          this.recordMetrics({
            validationTime: endTime - startTime,
            memoryUsage: endMemory - startMemory,
            cacheHitRate: 0,
            schemaComplexity: this.calculateSchemaComplexity(schema),
            validationCount: 1
          });
          
          throw error;
        }
      };
    }

    return schema;
  }

  /**
   * Generate cache key for data and schema
   */
  private static generateCacheKey(data: unknown, schema: z.ZodSchema): string {
    const dataHash = this.hashObject(data);
    const schemaHash = this.hashObject(schema._def);
    return `${schemaHash}:${dataHash}`;
  }

  /**
   * Hash an object for caching
   */
  private static hashObject(obj: unknown): string {
    const str = JSON.stringify(obj);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * Cleanup old cache entries
   */
  private static cleanupCache(): void {
    const now = Date.now();
    const entries = Array.from(this.validationCache.entries());
    
    // Remove expired entries
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.validationCache.delete(key);
      }
    }
    
    // Remove excess entries if cache is too large
    if (this.validationCache.size > this.CACHE_SIZE) {
      const sortedEntries = entries
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = sortedEntries.slice(0, this.validationCache.size - this.CACHE_SIZE);
      for (const [key] of toRemove) {
        this.validationCache.delete(key);
      }
    }
  }

  /**
   * Get current memory usage
   */
  private static getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }

  /**
   * Calculate schema complexity
   */
  private static calculateSchemaComplexity(schema: z.ZodSchema): number {
    let complexity = 1;
    
    if (schema instanceof z.ZodObject) {
      complexity += Object.keys(schema.shape).length;
    } else if (schema instanceof z.ZodArray) {
      complexity += 1 + this.calculateSchemaComplexity(schema.element);
    } else if (schema instanceof z.ZodUnion) {
      complexity += schema.options.length;
    } else if (schema instanceof z.ZodIntersection) {
      complexity += 2;
    }
    
    return complexity;
  }

  /**
   * Record performance metrics
   */
  private static recordMetrics(metrics: OptimizationPerformanceMetrics): void {
    this.metrics.push(metrics);
    
    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * Get performance metrics
   */
  static getMetrics(): OptimizationPerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get average performance metrics
   */
  static getAverageMetrics(): OptimizationPerformanceMetrics {
    if (this.metrics.length === 0) {
      return {
        validationTime: 0,
        memoryUsage: 0,
        cacheHitRate: 0,
        schemaComplexity: 0,
        validationCount: 0
      };
    }
    
    const total = this.metrics.reduce((acc, metrics) => ({
      validationTime: acc.validationTime + metrics.validationTime,
      memoryUsage: acc.memoryUsage + metrics.memoryUsage,
      cacheHitRate: acc.cacheHitRate + metrics.cacheHitRate,
      schemaComplexity: acc.schemaComplexity + metrics.schemaComplexity,
      validationCount: acc.validationCount + metrics.validationCount
    }), {
      validationTime: 0,
      memoryUsage: 0,
      cacheHitRate: 0,
      schemaComplexity: 0,
      validationCount: 0
    });
    
    const count = this.metrics.length;
    
    return {
      validationTime: total.validationTime / count,
      memoryUsage: total.memoryUsage / count,
      cacheHitRate: total.cacheHitRate / count,
      schemaComplexity: total.schemaComplexity / count,
      validationCount: total.validationCount
    };
  }

  /**
   * Clear performance metrics
   */
  static clearMetrics(): void {
    this.metrics = [];
    this.validationCache.clear();
  }

  /**
   * Analyze schema performance and provide recommendations
   */
  static analyzePerformance(schema: z.ZodSchema): OptimizationResult {
    const originalMetrics = this.getAverageMetrics();
    
    // Optimize the schema
    const optimizedSchema = this.optimizeSchema(schema);
    
    // Run some test validations to get optimized metrics
    const testData = this.generateTestData(schema);
    for (let i = 0; i < 100; i++) {
      try {
        optimizedSchema.parse(testData);
      } catch {
        // Ignore validation errors
      }
    }
    
    const optimizedMetrics = this.getAverageMetrics();
    
    const improvement = {
      timeImprovement: ((originalMetrics.validationTime - optimizedMetrics.validationTime) / originalMetrics.validationTime) * 100,
      memoryImprovement: ((originalMetrics.memoryUsage - optimizedMetrics.memoryUsage) / originalMetrics.memoryUsage) * 100,
      cacheHitRateImprovement: optimizedMetrics.cacheHitRate - originalMetrics.cacheHitRate
    };
    
    const recommendations: string[] = [];
    
    if (improvement.timeImprovement < 10) {
      recommendations.push('Consider simplifying the schema structure');
    }
    
    if (improvement.memoryImprovement < 5) {
      recommendations.push('Consider using more efficient data types');
    }
    
    if (optimizedMetrics.schemaComplexity > 20) {
      recommendations.push('Consider breaking down complex schemas into smaller ones');
    }
    
    if (optimizedMetrics.cacheHitRate < 0.5) {
      recommendations.push('Consider increasing cache TTL or size');
    }
    
    return {
      originalMetrics,
      optimizedMetrics,
      improvement,
      recommendations
    };
  }

  /**
   * Generate test data for performance testing
   */
  private static generateTestData(_schema: z.ZodSchema): Record<string, unknown> {
    // This would generate appropriate test data based on schema
    // For now, return a simple object
    return { test: 'data' };
  }
}

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { z } from 'zod';
const { LRUCache } = require('lru-cache');

export interface SchemaMetadata {
  schema: z.ZodSchema;
  compiledAt: Date;
  hash: string;
  size: number;
  complexity: number;
  dependencies: string[];
  usageCount: number;
  lastUsed: Date;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  hitRate: number;
  memoryUsage: number;
  averageAccessTime: number;
}

export interface CacheStatistics {
  schemaCache: { size: number; maxSize: number };
  validationCache: { size: number; maxSize: number };
  metadataCache: { size: number };
  metrics: CacheMetrics;
}

export interface ValidationCacheEntry<T = unknown> {
  data: T;
  timestamp: Date;
  ttl: number;
  schemaHash: string;
  accessCount: number;
  lastAccessed: Date;
}

@Injectable()
export class AdvancedCachingService implements OnModuleInit {
  private readonly logger = new Logger(AdvancedCachingService.name);
  
  // Multi-tier caching system
  private readonly schemaCache = new Map<string, z.ZodSchema>();
  private readonly schemaMetadataCache = new Map<string, SchemaMetadata>();
  private readonly validationResultCache = new LRUCache({
    max: 100000,
    ttl: 1000 * 60 * 10, // 10 minutes
    updateAgeOnGet: true,
    updateAgeOnHas: true,
  });
  
  // Performance metrics
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    evictions: 0,
    hitRate: 0,
    memoryUsage: 0,
    averageAccessTime: 0,
  };
  
  // Configuration
  private config = {
    enableSchemaPrecompilation: true,
    enableValidationCaching: true,
    enableMetadataCaching: true,
    maxSchemaCacheSize: 10000,
    maxValidationCacheSize: 100000,
    defaultValidationTTL: 1000 * 60 * 10, // 10 minutes
    enableMemoryOptimization: true,
    enableCompression: true,
  };

  async onModuleInit() {
    this.logger.log('Advanced Caching Service initialized');
    if (this.config.enableSchemaPrecompilation) {
      await this.precompileCommonSchemas();
    }
  }

  /**
   * Get or compile a schema with advanced caching
   */
  async getOrCompileSchema(schema: z.ZodSchema, options?: { 
    forceRecompile?: boolean;
    enableOptimization?: boolean;
  }): Promise<z.ZodSchema> {
    const startTime = performance.now();
    const schemaHash = this.generateSchemaHash(schema);
    
    // Check if schema is already compiled and cached
    if (!options?.forceRecompile && this.schemaCache.has(schemaHash)) {
      this.updateMetrics(true, performance.now() - startTime);
      this.updateSchemaUsage(schemaHash);
      return this.schemaCache.get(schemaHash)!;
    }

    // Compile schema with optimizations
    const compiledSchema = await this.compileSchema(schema, options);
    
    // Cache the compiled schema
    this.schemaCache.set(schemaHash, compiledSchema);
    
    // Update metadata
    await this.updateSchemaMetadata(schemaHash, compiledSchema);
    
    // Memory optimization
    if (this.config.enableMemoryOptimization) {
      await this.optimizeMemoryUsage();
    }

    this.updateMetrics(false, performance.now() - startTime);
    return compiledSchema;
  }

  /**
   * Get cached validation result
   */
  async getCachedValidation<T>(
    data: unknown,
    schema: z.ZodSchema,
    _options?: { ttl?: number }
  ): Promise<ValidationCacheEntry<T> | null> {
    const startTime = performance.now();
    const cacheKey = this.generateValidationCacheKey(data, schema);
    
    const cached = this.validationResultCache.get(cacheKey);
    if (cached) {
      // Check if cache entry is still valid
      const now = Date.now();
      const entryAge = now - cached.timestamp.getTime();
      
      if (entryAge < cached.ttl) {
        cached.accessCount++;
        cached.lastAccessed = new Date();
        this.updateMetrics(true, performance.now() - startTime);
        return cached as ValidationCacheEntry<T>;
      } else {
        // Remove expired entry
        this.validationResultCache.delete(cacheKey);
      }
    }

    this.updateMetrics(false, performance.now() - startTime);
    return null;
  }

  /**
   * Cache validation result
   */
  async cacheValidationResult<T>(
    data: unknown,
    schema: z.ZodSchema,
    result: T,
    options?: { ttl?: number }
  ): Promise<void> {
    const cacheKey = this.generateValidationCacheKey(data, schema);
    const ttl = options?.ttl || this.config.defaultValidationTTL;
    
    const entry: ValidationCacheEntry<T> = {
      data: result,
      timestamp: new Date(),
      ttl,
      schemaHash: this.generateSchemaHash(schema),
      accessCount: 1,
      lastAccessed: new Date(),
    };

    this.validationResultCache.set(cacheKey, entry);
  }

  /**
   * Precompile common schemas for better performance
   */
  private async precompileCommonSchemas(): Promise<void> {
    const commonSchemas = [
      { name: 'string', schema: z.string() },
      { name: 'number', schema: z.number() },
      { name: 'boolean', schema: z.boolean() },
      { name: 'email', schema: z.string().email() },
      { name: 'uuid', schema: z.string().uuid() },
      { name: 'url', schema: z.string().url() },
      { name: 'date', schema: z.date() },
      { name: 'array', schema: z.array(z.unknown()) },
      { name: 'object', schema: z.object({}) },
    ];

    for (const { name, schema } of commonSchemas) {
      try {
        await this.getOrCompileSchema(schema, { enableOptimization: true });
        this.logger.debug(`Precompiled common schema: ${name}`);
      } catch (error) {
        this.logger.warn(`Failed to precompile schema ${name}:`, error);
      }
    }
  }

  /**
   * Compile schema with optimizations
   */
  private async compileSchema(
    schema: z.ZodSchema,
    options?: { enableOptimization?: boolean }
  ): Promise<z.ZodSchema> {
    let compiledSchema = schema;

    if (options?.enableOptimization) {
      // Apply schema optimizations
      compiledSchema = this.optimizeSchema(schema);
    }

    // Add performance monitoring
    compiledSchema = this.addPerformanceMonitoring(compiledSchema);

    return compiledSchema;
  }

  /**
   * Optimize schema for better performance
   */
  private optimizeSchema(schema: z.ZodSchema): z.ZodSchema {
    // This is a simplified optimization - in practice, you'd implement
    // more sophisticated optimizations based on schema analysis
    return schema;
  }

  /**
   * Add performance monitoring to schema
   */
  private addPerformanceMonitoring(schema: z.ZodSchema): z.ZodSchema {
    const originalParse = schema.parse.bind(schema);
    const originalParseAsync = schema.parseAsync?.bind(schema);

    schema.parse = (data: unknown) => {
      const startTime = performance.now();
      try {
        const result = originalParse(data);
        this.recordValidationTime(performance.now() - startTime, true);
        return result;
      } catch (error) {
        this.recordValidationTime(performance.now() - startTime, false);
        throw error;
      }
    };

    if (originalParseAsync) {
      schema.parseAsync = async (data: unknown) => {
        const startTime = performance.now();
        try {
          const result = await originalParseAsync(data);
          this.recordValidationTime(performance.now() - startTime, true);
          return result;
        } catch (error) {
          this.recordValidationTime(performance.now() - startTime, false);
          throw error;
        }
      };
    }

    return schema;
  }

  /**
   * Update schema metadata
   */
  private async updateSchemaMetadata(schemaHash: string, schema: z.ZodSchema): Promise<void> {
    const metadata: SchemaMetadata = {
      schema,
      compiledAt: new Date(),
      hash: schemaHash,
      size: this.calculateSchemaSize(schema),
      complexity: this.calculateSchemaComplexity(schema),
      dependencies: this.extractDependencies(schema),
      usageCount: 0,
      lastUsed: new Date(),
    };

    this.schemaMetadataCache.set(schemaHash, metadata);
  }

  /**
   * Update schema usage statistics
   */
  private updateSchemaUsage(schemaHash: string): void {
    const metadata = this.schemaMetadataCache.get(schemaHash);
    if (metadata) {
      metadata.usageCount++;
      metadata.lastUsed = new Date();
    }
  }

  /**
   * Optimize memory usage by removing least used schemas
   */
  private async optimizeMemoryUsage(): Promise<void> {
    if (this.schemaCache.size <= this.config.maxSchemaCacheSize) {
      return;
    }

    // Sort schemas by usage and remove least used ones
    const schemas = Array.from(this.schemaMetadataCache.entries())
      .sort(([, a], [, b]) => a.usageCount - b.usageCount);

    const toRemove = schemas.slice(0, schemas.length - this.config.maxSchemaCacheSize);
    
    for (const [hash] of toRemove) {
      this.schemaCache.delete(hash);
      this.schemaMetadataCache.delete(hash);
    }

    this.logger.debug(`Optimized memory usage, removed ${toRemove.length} schemas`);
  }

  /**
   * Generate schema hash for caching
   */
  private generateSchemaHash(schema: z.ZodSchema): string {
    const schemaString = JSON.stringify(schema._def);
    return this.hashString(schemaString);
  }

  /**
   * Generate validation cache key
   */
  private generateValidationCacheKey(data: unknown, schema: z.ZodSchema): string {
    const dataHash = this.hashString(JSON.stringify(data));
    const schemaHash = this.generateSchemaHash(schema);
    return `${schemaHash}:${dataHash}`;
  }

  /**
   * Hash string using simple hash function
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Calculate schema size
   */
  private calculateSchemaSize(schema: z.ZodSchema): number {
    return JSON.stringify(schema._def).length;
  }

  /**
   * Calculate schema complexity
   */
  private calculateSchemaComplexity(schema: z.ZodSchema): number {
    // Simplified complexity calculation
    const def = schema._def as { typeName?: string; shape?: Record<string, unknown>; options?: unknown[] };
    let complexity = 1;
    
    if (def.typeName === 'ZodObject') {
      complexity += Object.keys(def.shape || {}).length;
    } else if (def.typeName === 'ZodArray') {
      complexity += 2;
    } else if (def.typeName === 'ZodUnion') {
      complexity += (def.options || []).length;
    }
    
    return complexity;
  }

  /**
   * Extract schema dependencies
   */
  private extractDependencies(schema: z.ZodSchema): string[] {
    // Simplified dependency extraction
    const dependencies: string[] = [];
    const def = schema._def as { typeName?: string; shape?: Record<string, { _def?: { typeName?: string } } > };
    
    if (def.typeName === 'ZodObject') {
      Object.values(def.shape || {}).forEach((field) => {
        if (field && typeof field === 'object' && '._def' in field ? false : true) {
          // noop guard
        }
        // best-effort narrow
        const inner = (field as { _def?: { typeName?: string } })._def;
        if (inner?.typeName) {
          dependencies.push(inner.typeName);
        }
      });
    }
    
    return dependencies;
  }

  /**
   * Update cache metrics
   */
  private updateMetrics(hit: boolean, accessTime: number): void {
    if (hit) {
      this.metrics.hits++;
    } else {
      this.metrics.misses++;
    }
    
    this.metrics.hitRate = this.metrics.hits / (this.metrics.hits + this.metrics.misses);
    this.metrics.averageAccessTime = 
      (this.metrics.averageAccessTime * (this.metrics.hits + this.metrics.misses - 1) + accessTime) / 
      (this.metrics.hits + this.metrics.misses);
  }

  /**
   * Record validation time for performance monitoring
   */
  private recordValidationTime(duration: number, success: boolean): void {
    // This would integrate with your metrics system
    this.logger.debug(`Validation completed in ${duration.toFixed(2)}ms, success: ${success}`);
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics {
    this.metrics.memoryUsage = this.calculateMemoryUsage();
    return { ...this.metrics };
  }

  /**
   * Calculate current memory usage
   */
  private calculateMemoryUsage(): number {
    let memoryUsage = 0;
    
    // Schema cache memory
    for (const [, metadata] of this.schemaMetadataCache) {
      memoryUsage += metadata.size;
    }
    
    // Validation cache memory (approximate)
    memoryUsage += this.validationResultCache.size * 1000; // Rough estimate
    
    return memoryUsage;
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.schemaCache.clear();
    this.schemaMetadataCache.clear();
    this.validationResultCache.clear();
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      hitRate: 0,
      memoryUsage: 0,
      averageAccessTime: 0,
    };
    this.logger.log('All caches cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStatistics(): CacheStatistics {
    return {
      schemaCache: {
        size: this.schemaCache.size,
        maxSize: this.config.maxSchemaCacheSize,
      },
      validationCache: {
        size: this.validationResultCache.size,
        maxSize: this.config.maxValidationCacheSize,
      },
      metadataCache: {
        size: this.schemaMetadataCache.size,
      },
      metrics: this.getMetrics(),
    };
  }
}

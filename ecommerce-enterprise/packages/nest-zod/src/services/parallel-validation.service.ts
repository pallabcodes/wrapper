import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { AdvancedCachingService } from './advanced-caching.service';

export interface BatchValidationResult<T = unknown> {
  success: boolean;
  results: Array<{
    index: number;
    success: boolean;
    data?: T;
    error?: z.ZodError;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
    executionTime: number;
  };
}

export interface ParallelValidationOptions {
  maxConcurrentValidations?: number;
  enableCaching?: boolean;
  enableEarlyExit?: boolean;
  chunkSize?: number;
  retryOnFailure?: boolean;
  maxRetries?: number;
  timeout?: number;
}

export interface ValidationChunk<T = unknown> {
  items: T[];
  startIndex: number;
  endIndex: number;
}

@Injectable()
export class ParallelValidationService {
  private readonly logger = new Logger(ParallelValidationService.name);
  
  private config: Required<ParallelValidationOptions> = {
    maxConcurrentValidations: 10,
    enableCaching: true,
    enableEarlyExit: false,
    chunkSize: 100,
    retryOnFailure: false,
    maxRetries: 3,
    timeout: 30000, // 30 seconds
  };

  constructor(
    private readonly cachingService: AdvancedCachingService
  ) {}

  /**
   * Validate a batch of items in parallel
   */
  async validateBatch<T>(
    items: T[],
    schema: z.ZodSchema,
    options?: ParallelValidationOptions
  ): Promise<BatchValidationResult<T>> {
    const startTime = performance.now();
    const config = { ...this.config, ...options };
    
    this.logger.debug(`Starting parallel validation of ${items.length} items`);
    
    // Check if we should use caching
    if (config.enableCaching) {
      const cachedResults = await this.getCachedBatchResults(items, schema);
      if (cachedResults) {
        this.logger.debug('Using cached batch results');
        return cachedResults;
      }
    }

    // Split items into chunks for parallel processing
    const chunks = this.createChunks(items, config.chunkSize);
    
    // Process chunks in parallel with concurrency limit
    const results = await this.processChunksInParallel(
      chunks,
      schema,
      config
    );

    // Merge results
    const batchResult = this.mergeBatchResults(results, items.length, startTime);
    
    // Cache results if enabled
    if (config.enableCaching) {
      await this.cacheBatchResults(items, schema, batchResult);
    }

    this.logger.debug(`Parallel validation completed in ${batchResult.summary.executionTime}ms`);
    return batchResult;
  }

  /**
   * Validate items with different schemas based on conditions
   */
  async validateBatchWithConditions<T>(
    items: T[],
    schemaSelector: (item: T, index: number) => z.ZodSchema,
    options?: ParallelValidationOptions
  ): Promise<BatchValidationResult<T>> {
    const startTime = performance.now();
    const config = { ...this.config, ...options };
    
    this.logger.debug(`Starting conditional parallel validation of ${items.length} items`);
    
    // Group items by schema to optimize processing
    const schemaGroups = this.groupItemsBySchema(items, schemaSelector);
    
    // Process each schema group in parallel
    const groupResults = await Promise.all(
      Object.entries(schemaGroups).map(async ([_schemaHash, group]) => {
        const schema = group.schema;
        const groupItems = group.items;
        
        return this.validateBatch(groupItems, schema, {
          ...config,
          maxConcurrentValidations: Math.min(config.maxConcurrentValidations, groupItems.length)
        });
      })
    );

    // Merge all group results
    const batchResult = this.mergeGroupResults(groupResults, items.length, startTime);
    
    this.logger.debug(`Conditional parallel validation completed in ${batchResult.summary.executionTime}ms`);
    return batchResult;
  }

  /**
   * Validate items with pipeline processing
   */
  async validateBatchWithPipeline<T>(
    items: T[],
    pipeline: Array<{
      name: string;
      schema: z.ZodSchema;
      condition?: (item: T, index: number) => boolean;
      transform?: (item: T) => T;
    }>,
    options?: ParallelValidationOptions
  ): Promise<BatchValidationResult<T>> {
    const startTime = performance.now();
    const config = { ...this.config, ...options };
    
    this.logger.debug(`Starting pipeline parallel validation of ${items.length} items`);
    
    let currentItems = items;
    const pipelineResults: Array<{
      step: string;
      results: BatchValidationResult<T>;
    }> = [];

    // Process each pipeline step
    for (const step of pipeline) {
      // Filter items that should be processed by this step
      const itemsToProcess = currentItems.filter((item, index) => 
        !step.condition || step.condition(item, index)
      );

      if (itemsToProcess.length === 0) {
        continue;
      }

      // Apply transformation if provided
      const transformedItems = step.transform 
        ? itemsToProcess.map(step.transform)
        : itemsToProcess;

      // Validate items for this step
      const stepResult = await this.validateBatch(transformedItems, step.schema, config);
      
      pipelineResults.push({
        step: step.name,
        results: stepResult
      });

      // Update current items with validated data
      currentItems = stepResult.results
        .filter(result => result.success)
        .map(result => result.data as T);

      // Early exit if configured and step failed
      if (config.enableEarlyExit && !stepResult.success) {
        this.logger.warn(`Pipeline step '${step.name}' failed, stopping pipeline`);
        break;
      }
    }

    // Merge pipeline results
    const batchResult = this.mergePipelineResults(pipelineResults, items.length, startTime);
    
    this.logger.debug(`Pipeline parallel validation completed in ${batchResult.summary.executionTime}ms`);
    return batchResult;
  }

  /**
   * Create chunks for parallel processing
   */
  private createChunks<T>(items: T[], chunkSize: number): ValidationChunk<T>[] {
    const chunks: ValidationChunk<T>[] = [];
    
    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push({
        items: items.slice(i, i + chunkSize),
        startIndex: i,
        endIndex: Math.min(i + chunkSize, items.length) - 1
      });
    }
    
    return chunks;
  }

  /**
   * Process chunks in parallel with concurrency limit
   */
  private async processChunksInParallel<T>(
    chunks: ValidationChunk<T>[],
    schema: z.ZodSchema,
    config: Required<ParallelValidationOptions>
  ): Promise<Array<{ chunk: ValidationChunk<T>; results: Array<{ success: boolean; data?: T; error?: z.ZodError }> }>> {
    const results: Array<{ chunk: ValidationChunk<T>; results: Array<{ success: boolean; data?: T; error?: z.ZodError }> }> = [];
    
    // Process chunks with concurrency limit
    for (let i = 0; i < chunks.length; i += config.maxConcurrentValidations) {
      const chunkBatch = chunks.slice(i, i + config.maxConcurrentValidations);
      
      const chunkResults = await Promise.all(
        chunkBatch.map(async (chunk) => {
          const chunkResult = await this.processChunk(chunk, schema, config);
          return { chunk, results: chunkResult };
        })
      );
      
      chunkResults.forEach(({ chunk, results: chunkResult }) => {
        results.push({ chunk, results: chunkResult });
      });
    }
    
    return results;
  }

  /**
   * Process a single chunk
   */
  private async processChunk<T>(
    chunk: ValidationChunk<T>,
    schema: z.ZodSchema,
    config: Required<ParallelValidationOptions>
  ): Promise<Array<{ success: boolean; data?: T; error?: z.ZodError }>> {
    const results: Array<{ success: boolean; data?: T; error?: z.ZodError }> = [];
    
    for (let i = 0; i < chunk.items.length; i++) {
      const item = chunk.items[i];
      // const globalIndex = chunk.startIndex + i;
      
      try {
        // Check cache first if enabled
        if (config.enableCaching) {
          const cached = await this.cachingService.getCachedValidation(item, schema);
          if (cached) {
            results.push({
              success: true,
              data: cached.data as T
            });
            continue;
          }
        }

        // Validate item
        const validatedData = await schema.parseAsync(item);
        
        // Cache result if enabled
        if (config.enableCaching) {
          await this.cachingService.cacheValidationResult(item, schema, validatedData);
        }
        
        results.push({
          success: true,
          data: validatedData
        });
        
      } catch (error) {
        if (error instanceof z.ZodError) {
          results.push({
            success: false,
            error
          });
        } else {
          results.push({
            success: false,
            error: new z.ZodError([{
              code: 'custom',
              message: error instanceof Error ? error.message : 'Unknown validation error',
              path: [],
            }])
          });
        }
      }
    }
    
    return results;
  }

  /**
   * Group items by schema for optimization
   */
  private groupItemsBySchema<T>(
    items: T[],
    schemaSelector: (item: T, index: number) => z.ZodSchema
  ): Record<string, { schema: z.ZodSchema; items: T[]; indices: number[] }> {
    const groups: Record<string, { schema: z.ZodSchema; items: T[]; indices: number[] }> = {};
    
    items.forEach((item, index) => {
      const schema = schemaSelector(item, index);
      const schemaHash = this.generateSchemaHash(schema);
      
      if (!groups[schemaHash]) {
        groups[schemaHash] = {
          schema,
          items: [],
          indices: []
        };
      }
      
      groups[schemaHash].items.push(item);
      groups[schemaHash].indices.push(index);
    });
    
    return groups;
  }

  /**
   * Merge batch results
   */
  private mergeBatchResults<T>(
    chunkResults: Array<{ chunk: ValidationChunk<T>; results: Array<{ success: boolean; data?: T; error?: z.ZodError }> }>,
    totalItems: number,
    startTime: number
  ): BatchValidationResult<T> {
    const results: Array<{ index: number; success: boolean; data?: T; error?: z.ZodError }> = [];
    let successful = 0;
    let failed = 0;
    
    // Flatten results from all chunks
    chunkResults.forEach(({ chunk, results: chunkResults }) => {
      chunkResults.forEach((result, localIndex) => {
        const globalIndex = chunk.startIndex + localIndex;
        const entry: { index: number; success: boolean; data?: T; error?: z.ZodError } = {
          index: globalIndex,
          success: result.success,
        };
        if (result.data !== undefined) {
          entry.data = result.data as T;
        }
        if (result.error !== undefined) {
          entry.error = result.error as z.ZodError;
        }
        results[globalIndex] = entry;
        
        if (result.success) {
          successful++;
        } else {
          failed++;
        }
      });
    });
    
    const executionTime = performance.now() - startTime;
    
    return {
      success: failed === 0,
      results,
      summary: {
        total: totalItems,
        successful,
        failed,
        successRate: successful / totalItems,
        executionTime
      }
    };
  }

  /**
   * Merge group results
   */
  private mergeGroupResults<T>(
    groupResults: BatchValidationResult<T>[],
    totalItems: number,
    startTime: number
  ): BatchValidationResult<T> {
    const results: Array<{ index: number; success: boolean; data?: T; error?: z.ZodError }> = [];
    let successful = 0;
    let failed = 0;
    
    // Merge results from all groups
    groupResults.forEach(groupResult => {
      groupResult.results.forEach(result => {
        results[result.index] = result;
        if (result.success) {
          successful++;
        } else {
          failed++;
        }
      });
    });
    
    const executionTime = performance.now() - startTime;
    
    return {
      success: failed === 0,
      results,
      summary: {
        total: totalItems,
        successful,
        failed,
        successRate: successful / totalItems,
        executionTime
      }
    };
  }

  /**
   * Merge pipeline results
   */
  private mergePipelineResults<T>(
    pipelineResults: Array<{ step: string; results: BatchValidationResult<T> }>,
    totalItems: number,
    startTime: number
  ): BatchValidationResult<T> {
    // Get results from the last successful step
    const lastStep = pipelineResults[pipelineResults.length - 1];
    if (!lastStep) {
      return {
        success: false,
        results: [],
        summary: {
          total: totalItems,
          successful: 0,
          failed: totalItems,
          successRate: 0,
          executionTime: performance.now() - startTime
        }
      };
    }
    
    return {
      ...lastStep.results,
      summary: {
        ...lastStep.results.summary,
        executionTime: performance.now() - startTime
      }
    };
  }

  /**
   * Get cached batch results
   */
  private async getCachedBatchResults<T>(
    _items: T[],
    _schema: z.ZodSchema
  ): Promise<BatchValidationResult<T> | null> {
    // This would implement batch-level caching
    // For now, return null to always process
    return null;
  }

  /**
   * Cache batch results
   */
  private async cacheBatchResults<T>(
    _items: T[],
    _schema: z.ZodSchema,
    _results: BatchValidationResult<T>
  ): Promise<void> {
    // This would implement batch-level caching
    // For now, do nothing
  }

  /**
   * Generate schema hash
   */
  private generateSchemaHash(schema: z.ZodSchema): string {
    const schemaString = JSON.stringify(schema._def);
    let hash = 0;
    for (let i = 0; i < schemaString.length; i++) {
      const char = schemaString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * Update configuration
   */
  updateConfig(options: Partial<ParallelValidationOptions>): void {
    this.config = { ...this.config, ...options };
    this.logger.log('Parallel validation configuration updated');
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<ParallelValidationOptions> {
    return { ...this.config };
  }
}

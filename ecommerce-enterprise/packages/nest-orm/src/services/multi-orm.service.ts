import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { DrizzleService } from './drizzle.service';
import { TypeOrmService } from './typeorm.service';
import { CacheService } from './cache.service';
import { PerformanceService } from './performance.service';
import { 
  DatabaseQuery, 
  QueryResult, 
  TransactionOptions, 
  TransactionResult, 
  ORMProvider,
  PerformanceMetrics,
  QueryAnalysis
} from '../types';

@Injectable()
export class MultiOrmService {
  private readonly logger = new Logger(MultiOrmService.name);
  private readonly performanceMetrics: PerformanceMetrics = {
    totalQueries: 0,
    averageExecutionTime: 0,
    slowQueries: 0,
    cacheHitRate: 0,
    errorRate: 0,
    providerUsage: {
      prisma: { queries: 0, averageTime: 0, errors: 0 },
      drizzle: { queries: 0, averageTime: 0, errors: 0 },
      typeorm: { queries: 0, averageTime: 0, errors: 0 }
    }
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly drizzleService: DrizzleService,
    private readonly typeOrmService: TypeOrmService,
    private readonly cacheService: CacheService,
    private readonly performanceService: PerformanceService
  ) {}

  /**
   * Execute a database query with intelligent provider selection
   */
  async query<T = any>(query: DatabaseQuery<T>): Promise<QueryResult<T>> {
    const startTime = Date.now();
    
    try {
      // Check cache first if enabled
      if (query.options?.useCache) {
        const cached = await this.cacheService.get<T[]>(this.getCacheKey(query));
        if (cached) {
          this.logger.debug(`Cache hit for query: ${query.table}`);
          return {
            data: cached,
            executionTime: Date.now() - startTime,
            provider: 'prisma' as ORMProvider, // Cache doesn't specify provider
            metadata: { cached: true }
          };
        }
      }

      // Select optimal provider
      const provider = this.selectOptimalProvider(query);
      
      // Execute query with selected provider
      const result = await this.executeQuery(provider, query);
      
      // Update performance metrics
      this.updatePerformanceMetrics(provider, Date.now() - startTime, false);
      
      // Cache result if enabled
      if (query.options?.useCache) {
        await this.cacheService.set(
          this.getCacheKey(query), 
          result.data, 
          query.options.cacheTtl || 3600
        );
      }

      return {
        ...result,
        executionTime: Date.now() - startTime,
        provider
      };

    } catch (error) {
      this.logger.error(`Query execution failed: ${(error as Error).message}`, (error as Error).stack);
      this.updatePerformanceMetrics('prisma', Date.now() - startTime, true);
      throw error;
    }
  }

  /**
   * Execute multiple queries in a transaction
   */
  async transaction<T = any>(
    queries: DatabaseQuery[],
    options?: TransactionOptions
  ): Promise<TransactionResult<T>> {
    const startTime = Date.now();
    const provider = this.selectOptimalProvider(queries[0] || (() => { throw new Error('No queries provided'); })());
    
    try {
      const result = await this.executeTransaction<any>(provider, queries, options);
      
      this.updatePerformanceMetrics(provider, Date.now() - startTime, false);
      
      return {
        data: result,
        executionTime: Date.now() - startTime,
        provider
      };

    } catch (error) {
      this.logger.error(`Transaction execution failed: ${(error as Error).message}`, (error as Error).stack);
      this.updatePerformanceMetrics(provider, Date.now() - startTime, true);
      throw error;
    }
  }

  /**
   * Analyze query performance and provide recommendations
   */
  async analyzeQuery(query: DatabaseQuery): Promise<QueryAnalysis> {
    return this.performanceService.analyzeQuery(query);
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Reset performance metrics
   */
  resetPerformanceMetrics(): void {
    this.performanceMetrics.totalQueries = 0;
    this.performanceMetrics.averageExecutionTime = 0;
    this.performanceMetrics.slowQueries = 0;
    this.performanceMetrics.cacheHitRate = 0;
    this.performanceMetrics.errorRate = 0;
    
    Object.keys(this.performanceMetrics.providerUsage).forEach(provider => {
      this.performanceMetrics.providerUsage[provider as ORMProvider] = {
        queries: 0,
        averageTime: 0,
        errors: 0
      };
    });
  }

  /**
   * Select optimal ORM provider based on query characteristics
   */
  private selectOptimalProvider(query: DatabaseQuery): ORMProvider {
    const primary = this.configService.get<string>('ORM_PRIMARY_PROVIDER', 'prisma');
    const fallbacks = this.configService.get<string[]>('ORM_FALLBACK_PROVIDERS', []);
    
    // Simple provider selection logic - can be enhanced with ML
    if (query.type === 'raw' || query.sql) {
      return 'drizzle'; // Drizzle is better for raw SQL
    }
    
    if (query.type === 'select' && query.include && query.include.length > 0) {
      return 'prisma'; // Prisma has better relation handling
    }
    
    if (query.type === 'insert' && Array.isArray(query.data)) {
      return 'typeorm'; // TypeORM has better batch insert support
    }
    
    // Check provider health
    const availableProviders = this.getAvailableProviders();
    if (availableProviders.includes(primary as ORMProvider)) {
      return primary as ORMProvider;
    }
    
    // Use first available fallback
    for (const fallback of fallbacks) {
      if (availableProviders.includes(fallback as ORMProvider)) {
        return fallback as ORMProvider;
      }
    }
    
    // Default to prisma
    return 'prisma';
  }

  /**
   * Get list of available providers
   */
  private getAvailableProviders(): ORMProvider[] {
    const providers: ORMProvider[] = [];
    
    if (this.prismaService.isConnected()) {
      providers.push('prisma');
    }
    
    if (this.drizzleService.isConnected()) {
      providers.push('drizzle');
    }
    
    if (this.typeOrmService.isConnected()) {
      providers.push('typeorm');
    }
    
    return providers;
  }

  /**
   * Execute query with specific provider
   */
  private async executeQuery<T>(
    provider: ORMProvider, 
    query: DatabaseQuery<T>
  ): Promise<QueryResult<T>> {
    switch (provider) {
      case 'prisma':
        return this.prismaService.execute(query);
      
      case 'drizzle':
        return this.drizzleService.execute(query);
      
      case 'typeorm':
        return this.typeOrmService.execute(query);
      
      default:
        throw new Error(`Unsupported ORM provider: ${provider}`);
    }
  }

  /**
   * Execute transaction with specific provider
   */
  private async executeTransaction<T = any>(
    provider: ORMProvider,
    queries: DatabaseQuery[],
    options?: TransactionOptions
  ): Promise<T> {
    switch (provider) {
      case 'prisma':
        return this.prismaService.executeTransaction(queries, options);
      
      case 'drizzle':
        return this.drizzleService.executeTransaction(queries, options);
      
      case 'typeorm':
        return this.typeOrmService.executeTransaction(queries, options);
      
      default:
        throw new Error(`Unsupported ORM provider: ${provider}`);
    }
  }

  /**
   * Generate cache key for query
   */
  private getCacheKey(query: DatabaseQuery): string {
    return `orm:query:${JSON.stringify(query)}`;
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(
    provider: ORMProvider, 
    executionTime: number, 
    isError: boolean
  ): void {
    this.performanceMetrics.totalQueries++;
    
    // Update average execution time
    const totalTime = this.performanceMetrics.averageExecutionTime * (this.performanceMetrics.totalQueries - 1);
    this.performanceMetrics.averageExecutionTime = (totalTime + executionTime) / this.performanceMetrics.totalQueries;
    
    // Update slow queries count
    const slowThreshold = this.configService.get<number>('ORM_SLOW_QUERY_THRESHOLD', 1000);
    if (executionTime > slowThreshold) {
      this.performanceMetrics.slowQueries++;
    }
    
    // Update error rate
    if (isError) {
      this.performanceMetrics.errorRate = (this.performanceMetrics.errorRate * (this.performanceMetrics.totalQueries - 1) + 1) / this.performanceMetrics.totalQueries;
    }
    
    // Update provider-specific metrics
    const providerMetrics = this.performanceMetrics.providerUsage[provider];
    providerMetrics.queries++;
    
    const totalProviderTime = providerMetrics.averageTime * (providerMetrics.queries - 1);
    providerMetrics.averageTime = (totalProviderTime + executionTime) / providerMetrics.queries;
    
    if (isError) {
      providerMetrics.errors++;
    }
  }
}

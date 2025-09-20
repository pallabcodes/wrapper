import { Injectable, Logger } from '@nestjs/common';
import { DatabaseQuery, QueryAnalysis, PerformanceMetrics } from '../types';

@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name);
  private queryHistory: Array<{
    query: DatabaseQuery;
    executionTime: number;
    timestamp: Date;
    provider: string;
  }> = [];

  /**
   * Analyze query performance and provide recommendations
   */
  async analyzeQuery(query: DatabaseQuery): Promise<QueryAnalysis> {
    const complexity = this.calculateComplexity(query);
    const optimizations = this.getOptimizations(query, complexity);
    const performanceScore = this.calculatePerformanceScore(query, complexity);
    const indexRecommendations = this.getIndexRecommendations(query);
    const patterns = this.analyzePatterns(query);

    return {
      complexity,
      optimizations,
      performanceScore,
      indexRecommendations,
      patterns
    };
  }

  /**
   * Record query execution for analysis
   */
  recordQuery(
    query: DatabaseQuery, 
    executionTime: number, 
    provider: string
  ): void {
    this.queryHistory.push({
      query,
      executionTime,
      timestamp: new Date(),
      provider
    });

    // Keep only last 1000 queries
    if (this.queryHistory.length > 1000) {
      this.queryHistory = this.queryHistory.slice(-1000);
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    const totalQueries = this.queryHistory.length;
    const averageExecutionTime = totalQueries > 0 
      ? this.queryHistory.reduce((sum, q) => sum + q.executionTime, 0) / totalQueries 
      : 0;
    
    const slowQueries = this.queryHistory.filter(q => q.executionTime > 1000).length;
    const errorRate = 0; // Would need to track errors separately
    
    const providerUsage = {
      prisma: { queries: 0, averageTime: 0, errors: 0 },
      drizzle: { queries: 0, averageTime: 0, errors: 0 },
      typeorm: { queries: 0, averageTime: 0, errors: 0 }
    };

    // Calculate provider usage
    this.queryHistory.forEach(q => {
      const provider = q.provider as keyof typeof providerUsage;
      if (providerUsage[provider]) {
        providerUsage[provider].queries++;
        providerUsage[provider].averageTime += q.executionTime;
      }
    });

    // Calculate average times
    Object.keys(providerUsage).forEach(provider => {
      const p = provider as keyof typeof providerUsage;
      if (providerUsage[p].queries > 0) {
        providerUsage[p].averageTime /= providerUsage[p].queries;
      }
    });

    return {
      totalQueries,
      averageExecutionTime,
      slowQueries,
      cacheHitRate: 0, // Would need to track cache hits
      errorRate,
      providerUsage
    };
  }

  /**
   * Calculate query complexity score
   */
  private calculateComplexity(query: DatabaseQuery): number {
    let complexity = 1;

    // Base complexity
    complexity += 1;

    // Where conditions complexity
    if (query.where) {
      const whereKeys = Object.keys(query.where).length;
      complexity += whereKeys * 0.5;
    }

    // Join complexity
    if (query.include && query.include.length > 0) {
      complexity += query.include.length * 2;
    }

    // Group by complexity
    if (query.groupBy && query.groupBy.length > 0) {
      complexity += query.groupBy.length * 1.5;
    }

    // Having complexity
    if (query.having) {
      complexity += Object.keys(query.having).length * 0.8;
    }

    // Raw query complexity
    if (query.type === 'raw' && query.sql) {
      complexity += this.analyzeSqlComplexity(query.sql);
    }

    return Math.round(complexity * 10) / 10;
  }

  /**
   * Analyze SQL complexity for raw queries
   */
  private analyzeSqlComplexity(sql: string): number {
    let complexity = 0;
    const upperSql = sql.toUpperCase();

    // Count JOINs
    const joins = (upperSql.match(/JOIN/g) || []).length;
    complexity += joins * 2;

    // Count subqueries
    const subqueries = (upperSql.match(/SELECT.*FROM.*SELECT/g) || []).length;
    complexity += subqueries * 3;

    // Count UNIONs
    const unions = (upperSql.match(/UNION/g) || []).length;
    complexity += unions * 1.5;

    // Count window functions
    const windowFunctions = (upperSql.match(/OVER\s*\(/g) || []).length;
    complexity += windowFunctions * 2;

    return complexity;
  }

  /**
   * Get optimization recommendations
   */
  private getOptimizations(query: DatabaseQuery, complexity: number): string[] {
    const optimizations: string[] = [];

    // High complexity optimizations
    if (complexity > 10) {
      optimizations.push('Consider breaking down complex query into smaller parts');
      optimizations.push('Use query batching for multiple operations');
    }

    // Where clause optimizations
    if (query.where) {
      const whereKeys = Object.keys(query.where);
      if (whereKeys.length > 5) {
        optimizations.push('Consider using compound indexes for multiple where conditions');
      }
    }

    // Join optimizations
    if (query.include && query.include.length > 3) {
      optimizations.push('Consider eager loading or separate queries for many relations');
    }

    // Pagination optimizations
    if (query.pagination && query.pagination.page > 100) {
      optimizations.push('Consider using cursor-based pagination for large offsets');
    }

    // Raw query optimizations
    if (query.type === 'raw' && query.sql) {
      if (query.sql.toUpperCase().includes('SELECT *')) {
        optimizations.push('Avoid SELECT * - specify only needed columns');
      }
      if (query.sql.toUpperCase().includes('ORDER BY') && !query.sql.toUpperCase().includes('LIMIT')) {
        optimizations.push('Add LIMIT clause to ORDER BY queries');
      }
    }

    // Caching recommendations
    if (query.type === 'select' && complexity < 5) {
      optimizations.push('Consider caching this query result');
    }

    return optimizations;
  }

  /**
   * Calculate performance score (0-100)
   */
  private calculatePerformanceScore(query: DatabaseQuery, complexity: number): number {
    let score = 100;

    // Reduce score based on complexity
    score -= Math.min(complexity * 5, 50);

    // Reduce score for missing optimizations
    if (query.type === 'select' && !query.pagination) {
      score -= 10;
    }

    if (query.type === 'raw' && query.sql?.toUpperCase().includes('SELECT *')) {
      score -= 15;
    }

    if (query.include && query.include.length > 5) {
      score -= 20;
    }

    return Math.max(0, Math.round(score));
  }

  /**
   * Get index recommendations
   */
  private getIndexRecommendations(query: DatabaseQuery): string[] {
    const recommendations: string[] = [];

    if (query.where) {
      const whereKeys = Object.keys(query.where);
      
      // Single column indexes
      whereKeys.forEach(key => {
        recommendations.push(`Consider index on ${key}`);
      });

      // Compound indexes for multiple conditions
      if (whereKeys.length > 1) {
        recommendations.push(`Consider compound index on (${whereKeys.join(', ')})`);
      }
    }

    // Order by indexes
    if (query.orderBy) {
      const orderKeys = Object.keys(query.orderBy);
      orderKeys.forEach(key => {
        recommendations.push(`Consider index on ${key} for ORDER BY`);
      });
    }

    // Include indexes
    if (query.include && query.include.length > 0) {
      query.include.forEach(relation => {
        recommendations.push(`Consider foreign key index for ${relation}`);
      });
    }

    return recommendations;
  }

  /**
   * Analyze query patterns
   */
  private analyzePatterns(query: DatabaseQuery): Array<{
    type: string;
    frequency: number;
    averageTime: number;
  }> {
    const patterns: Array<{
      type: string;
      frequency: number;
      averageTime: number;
    }> = [];

    // Query type patterns
    const typePatterns = this.queryHistory.reduce((acc, q) => {
      if (!acc[q.query.type]) {
        acc[q.query.type] = { count: 0, totalTime: 0 };
      }
      acc[q.query.type].count++;
      acc[q.query.type].totalTime += q.executionTime;
      return acc;
    }, {} as Record<string, { count: number; totalTime: number }>);

    Object.entries(typePatterns).forEach(([type, stats]) => {
      patterns.push({
        type: `${type} queries`,
        frequency: stats.count,
        averageTime: stats.totalTime / stats.count
      });
    });

    // Table usage patterns
    const tablePatterns = this.queryHistory.reduce((acc, q) => {
      if (!acc[q.query.table]) {
        acc[q.query.table] = { count: 0, totalTime: 0 };
      }
      acc[q.query.table].count++;
      acc[q.query.table].totalTime += q.executionTime;
      return acc;
    }, {} as Record<string, { count: number; totalTime: number }>);

    Object.entries(tablePatterns).forEach(([table, stats]) => {
      patterns.push({
        type: `${table} table`,
        frequency: stats.count,
        averageTime: stats.totalTime / stats.count
      });
    });

    return patterns.sort((a, b) => b.frequency - a.frequency);
  }
}

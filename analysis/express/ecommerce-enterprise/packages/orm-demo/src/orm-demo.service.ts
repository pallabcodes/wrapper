import { Injectable, Logger } from '@nestjs/common';
import { 
  MultiOrmService, 
  DatabaseQuery, 
  UseProvider, 
  Cache, 
  Optimize,
  Batch,
  Priority,
  Analyze
} from '@ecommerce-enterprise/nest-orm';

@Injectable()
export class OrmDemoService {
  private readonly logger = new Logger(OrmDemoService.name);

  constructor(private readonly orm: MultiOrmService) {}

  /**
   * Demo 1: Basic query with automatic provider selection
   */
  async getUsers() {
    this.logger.log('Demo 1: Basic query with automatic provider selection');
    
    const query: DatabaseQuery = {
      type: 'select',
      table: 'users',
      where: { active: true },
      pagination: { page: 1, limit: 10 }
    };

    const result = await this.orm.query(query);
    this.logger.log(`Query executed with provider: ${result.provider}`);
    this.logger.log(`Execution time: ${result.executionTime}ms`);
    
    return result;
  }

  /**
   * Demo 2: Query with specific provider (Prisma)
   */
  @UseProvider('prisma')
  @Cache(3600)
  @Optimize({ useBatching: true, priority: 10 })
  async getUsersWithPrisma() {
    this.logger.log('Demo 2: Query with Prisma provider and optimizations');
    
    const query: DatabaseQuery = {
      type: 'select',
      table: 'users',
      include: ['profile', 'orders'],
      where: { active: true },
      orderBy: { created_at: 'desc' }
    };

    const result = await this.orm.query(query);
    this.logger.log(`Prisma query executed in ${result.executionTime}ms`);
    
    return result;
  }

  /**
   * Demo 3: Raw SQL query with Drizzle
   */
  @UseProvider('drizzle')
  @Analyze()
  async getComplexReport() {
    this.logger.log('Demo 3: Complex raw SQL query with Drizzle');
    
    const query: DatabaseQuery = {
      type: 'raw',
      sql: `
        SELECT 
          u.id,
          u.email,
          u.created_at,
          COUNT(o.id) as order_count,
          SUM(o.total) as total_spent
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        WHERE u.created_at > $1
        GROUP BY u.id, u.email, u.created_at
        ORDER BY total_spent DESC
        LIMIT 10
      `,
      params: [new Date('2024-01-01')]
    };

    const result = await this.orm.query(query);
    this.logger.log(`Drizzle raw query executed in ${result.executionTime}ms`);
    
    return result;
  }

  /**
   * Demo 4: Batch operations with TypeORM
   */
  @UseProvider('typeorm')
  @Batch(50)
  @Priority(5)
  async batchInsertUsers(users: any[]) {
    this.logger.log(`Demo 4: Batch insert ${users.length} users with TypeORM`);
    
    const queries: DatabaseQuery[] = users.map(user => ({
      type: 'insert',
      table: 'users',
      data: user
    }));

    const results = await Promise.all(queries.map(q => this.orm.query(q)));
    this.logger.log(`Batch insert completed with ${results.length} operations`);
    
    return results;
  }

  /**
   * Demo 5: Transaction with multiple operations
   */
  async createUserWithProfile(userData: any, profileData: any) {
    this.logger.log('Demo 5: Transaction with multiple operations');
    
    const queries: DatabaseQuery[] = [
      {
        type: 'insert',
        table: 'users',
        data: userData
      },
      {
        type: 'insert',
        table: 'profiles',
        data: { ...profileData, user_id: '{{previous_result.id}}' }
      },
      {
        type: 'insert',
        table: 'user_settings',
        data: { 
          user_id: '{{previous_result.id}}',
          theme: 'light',
          notifications: true
        }
      }
    ];

    const result = await this.orm.transaction(queries);
    this.logger.log('Transaction completed successfully');
    
    return result;
  }

  /**
   * Demo 6: Performance analysis
   */
  async analyzeQueryPerformance() {
    this.logger.log('Demo 6: Query performance analysis');
    
    const query: DatabaseQuery = {
      type: 'select',
      table: 'users',
      include: ['profile', 'orders', 'settings'],
      where: { 
        active: true,
        created_at: { gte: new Date('2024-01-01') }
      },
      orderBy: { created_at: 'desc' }
    };

    // Analyze the query
    const analysis = await this.orm.analyzeQuery(query);
    
    this.logger.log('Query Analysis Results:');
    this.logger.log(`- Complexity Score: ${analysis.complexity}`);
    this.logger.log(`- Performance Score: ${analysis.performanceScore}/100`);
    this.logger.log(`- Optimizations: ${analysis.optimizations.join(', ')}`);
    this.logger.log(`- Index Recommendations: ${analysis.indexRecommendations.join(', ')}`);
    
    return analysis;
  }

  /**
   * Demo 7: Performance metrics
   */
  async getPerformanceMetrics() {
    this.logger.log('Demo 7: Performance metrics');
    
    const metrics = this.orm.getPerformanceMetrics();
    
    this.logger.log('Performance Metrics:');
    this.logger.log(`- Total Queries: ${metrics.totalQueries}`);
    this.logger.log(`- Average Execution Time: ${metrics.averageExecutionTime.toFixed(2)}ms`);
    this.logger.log(`- Slow Queries: ${metrics.slowQueries}`);
    this.logger.log(`- Cache Hit Rate: ${metrics.cacheHitRate}%`);
    this.logger.log(`- Error Rate: ${metrics.errorRate}%`);
    
    this.logger.log('Provider Usage:');
    Object.entries(metrics.providerUsage).forEach(([provider, stats]) => {
      this.logger.log(`  ${provider}: ${stats.queries} queries, ${stats.averageTime.toFixed(2)}ms avg, ${stats.errors} errors`);
    });
    
    return metrics;
  }

  /**
   * Demo 8: Caching demonstration
   */
  async demonstrateCaching() {
    this.logger.log('Demo 8: Caching demonstration');
    
    const query: DatabaseQuery = {
      type: 'select',
      table: 'users',
      where: { active: true },
      options: {
        useCache: true,
        cacheTtl: 60 // 1 minute cache
      }
    };

    // First execution (cache miss)
    const start1 = Date.now();
    const result1 = await this.orm.query(query);
    const time1 = Date.now() - start1;
    
    // Second execution (cache hit)
    const start2 = Date.now();
    const result2 = await this.orm.query(query);
    const time2 = Date.now() - start2;
    
    this.logger.log(`First execution (cache miss): ${time1}ms`);
    this.logger.log(`Second execution (cache hit): ${time2}ms`);
    this.logger.log(`Cache speedup: ${(time1 / time2).toFixed(2)}x faster`);
    
    return { result1, result2, time1, time2 };
  }

  /**
   * Demo 9: Error handling and fallback
   */
  async demonstrateErrorHandling() {
    this.logger.log('Demo 9: Error handling and fallback');
    
    try {
      // This query will fail due to invalid table name
      const query: DatabaseQuery = {
        type: 'select',
        table: 'non_existent_table',
        where: { id: 1 }
      };

      await this.orm.query(query);
    } catch (error) {
      this.logger.error('Query failed as expected:', error.message);
      
      // The system should automatically fallback to another provider
      // if the primary provider fails
      this.logger.log('System will automatically retry with fallback provider');
    }
  }

  /**
   * Demo 10: Multi-tenant query
   */
  async demonstrateMultiTenancy(tenantId: string) {
    this.logger.log(`Demo 10: Multi-tenant query for tenant: ${tenantId}`);
    
    const query: DatabaseQuery = {
      type: 'select',
      table: 'users',
      where: { 
        active: true,
        tenant_id: tenantId // Tenant isolation
      },
      options: {
        useCache: true,
        cacheTtl: 300 // 5 minutes cache per tenant
      }
    };

    const result = await this.orm.query(query);
    this.logger.log(`Multi-tenant query executed for tenant ${tenantId}`);
    
    return result;
  }
}

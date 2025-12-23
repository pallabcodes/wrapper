import { Injectable, Logger } from '@nestjs/common';
import { DatabaseQuery, QueryResult, TransactionOptions } from '../types';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { PgTable } from 'drizzle-orm/pg-core';
import postgres from 'postgres';
import { eq, and, sql } from 'drizzle-orm';

type DrizzleTransaction = Parameters<Parameters<PostgresJsDatabase<Record<string, never>>['transaction']>[0]>[0];

@Injectable()
export class DrizzleService {
  private readonly logger = new Logger(DrizzleService.name);
  private db!: PostgresJsDatabase<Record<string, never>>;
  private isConnectedFlag = false;

  constructor() {
    this.connect();
  }

  async connect(): Promise<void> {
    try {
      const connectionString = process.env['DATABASE_URL'] || 'postgresql://localhost:5432/ecommerce';
      const client = postgres(connectionString);
      this.db = drizzle(client);
      this.isConnectedFlag = true;
      this.logger.log('Drizzle connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to Drizzle', error);
      this.isConnectedFlag = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      // Drizzle doesn't have explicit disconnect
      this.isConnectedFlag = false;
      this.logger.log('Drizzle disconnected successfully');
    } catch (error) {
      this.logger.error('Failed to disconnect from Drizzle', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.isConnectedFlag;
  }

  async execute<T = unknown>(query: DatabaseQuery<T>): Promise<QueryResult<T>> {
    const startTime = Date.now();
    
    try {
      let result: unknown;
      
      switch (query.type) {
        case 'select':
          result = await this.executeSelect(query);
          break;
        
        case 'insert':
          result = await this.executeInsert(query);
          break;
        
        case 'update':
          result = await this.executeUpdate(query);
          break;
        
        case 'delete':
          result = await this.executeDelete(query);
          break;
        
        case 'raw':
          result = await this.executeRaw(query);
          break;
        
        default:
          throw new Error(`Unsupported query type: ${query.type}`);
      }

      return {
        data: Array.isArray(result) ? result : [result],
        executionTime: Date.now() - startTime,
        provider: 'drizzle'
      };

    } catch (error) {
      this.logger.error(`Drizzle query execution failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  async executeTransaction<T = unknown>(
    queries: DatabaseQuery[],
    _options?: TransactionOptions
  ): Promise<T> {
    // const startTime = Date.now();
    
    try {
      const result = await this.db.transaction(async (tx) => {
        const results = [];
        
        for (const query of queries) {
          const queryResult = await this.executeWithTransaction(tx, query);
          results.push(queryResult);
        }
        
        return results;
      });

      return result as T;

    } catch (error) {
      this.logger.error(`Drizzle transaction execution failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  private async executeSelect<T>(query: DatabaseQuery<T>): Promise<T[]> {
    const table = this.getTable(query.table);
    
    let selectQuery = this.db.select().from(table);
    
    // Apply where conditions
    if (query.where) {
      const whereConditions = this.buildWhereConditions(query.where);
      if (whereConditions.length > 0) {
        selectQuery = selectQuery.where(and(...whereConditions)) as typeof selectQuery;
      }
    }
    
    // Apply ordering
    if (query.orderBy) {
      const orderByColumns = Object.entries(query.orderBy).map(([column, direction]) => 
        direction === 'desc' ? sql`${sql.identifier(column)} DESC` : sql`${sql.identifier(column)} ASC`
      );
      selectQuery = selectQuery.orderBy(...orderByColumns) as typeof selectQuery;
    }
    
    // Apply pagination
    if (query.pagination) {
      const { page, limit } = query.pagination;
      const offset = (page - 1) * limit;
      selectQuery = selectQuery.limit(limit).offset(offset) as typeof selectQuery;
    }
    
    // Apply field selection
    if (query.select) {
      const selectFields = query.select.map(field => sql.identifier(field));
      selectQuery = this.db.select(...selectFields).from(table) as typeof selectQuery;
    }
    
    return await selectQuery as T[];
  }

  private async executeInsert<T>(query: DatabaseQuery<T>): Promise<T> {
    const table = this.getTable(query.table);
    
    if (Array.isArray(query.data)) {
      const result = await this.db.insert(table).values(query.data || []).returning();
      return result as T;
    } else {
      const result = await this.db.insert(table).values(query.data || {}).returning();
      return result[0] as T;
    }
  }

  private async executeUpdate<T>(query: DatabaseQuery<T>): Promise<T> {
    const table = this.getTable(query.table);
    
    const whereConditions = this.buildWhereConditions(query.where || {});
    const result = await this.db
      .update(table)
      .set(query.data || {})
      .where(and(...whereConditions))
      .returning();
    
    return result[0] as T;
  }

  private async executeDelete<T>(query: DatabaseQuery<T>): Promise<T> {
    const table = this.getTable(query.table);
    
    const whereConditions = this.buildWhereConditions(query.where || {});
    const result = await this.db
      .delete(table)
      .where(and(...whereConditions))
      .returning();
    
    return result[0] as T;
  }

  private async executeRaw<T>(query: DatabaseQuery<T>): Promise<T[]> {
    if (!query.sql) {
      throw new Error('Raw SQL query requires sql property');
    }
    
    const params = query.params || [];
    if (params.length === 0) {
      return await this.db.execute(sql.raw(query.sql)) as T[];
    } else {
      // Use sql template for parameterized queries
      const rawSql = sql.raw(query.sql, params);
      return await this.db.execute(rawSql) as T[];
    }
  }

  private async executeWithTransaction(tx: DrizzleTransaction, query: DatabaseQuery): Promise<unknown> {
    const table = this.getTable(query.table);
    
    switch (query.type) {
      case 'select':
        let selectQuery = tx.select().from(table);
        
        if (query.where) {
          const whereConditions = this.buildWhereConditions(query.where);
          if (whereConditions.length > 0) {
            selectQuery = selectQuery.where(and(...whereConditions));
          }
        }
        
        if (query.orderBy) {
          const orderByColumns = Object.entries(query.orderBy).map(([column, direction]) => 
            direction === 'desc' ? sql`${sql.identifier(column)} DESC` : sql`${sql.identifier(column)} ASC`
          );
          selectQuery = selectQuery.orderBy(...orderByColumns);
        }
        
        return await selectQuery;
      
      case 'insert':
        if (Array.isArray(query.data)) {
          return await tx.insert(table).values(query.data).returning();
        } else {
          const result = await tx.insert(table).values(query.data).returning();
          return result[0];
        }
      
      case 'update':
        const whereConditions = this.buildWhereConditions(query.where || {});
        const result = await tx
          .update(table)
          .set(query.data)
          .where(and(...whereConditions))
          .returning();
        return result[0];
      
      case 'delete':
        const deleteConditions = this.buildWhereConditions(query.where || {});
        const deleteResult = await tx
          .delete(table)
          .where(and(...deleteConditions))
          .returning();
        return deleteResult[0];
      
      case 'raw':
        const params = query.params || [];
        if (params.length === 0) {
          return await tx.execute(sql.raw(query.sql!));
        } else {
          // Use sql template for parameterized queries
          const rawSql = sql.raw(query.sql!, params);
          return await tx.execute(rawSql);
        }
      
      default:
        throw new Error(`Unsupported query type: ${query.type}`);
    }
  }

  private getTable(tableName: string): PgTable {
    // In a real implementation, you would have a table registry
    // For now, we'll use a simple approach
    return sql.identifier(tableName) as unknown as PgTable;
  }

  private buildWhereConditions(where: Record<string, unknown>): ReturnType<typeof eq>[] {
    const conditions: ReturnType<typeof eq>[] = [];
    
    Object.entries(where).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        // Handle complex conditions like { gte: 10, lte: 20 }
        Object.entries(value).forEach(([operator, val]) => {
          switch (operator) {
            case 'gte':
              conditions.push(sql`${sql.identifier(key)} >= ${val}`);
              break;
            case 'lte':
              conditions.push(sql`${sql.identifier(key)} <= ${val}`);
              break;
            case 'gt':
              conditions.push(sql`${sql.identifier(key)} > ${val}`);
              break;
            case 'lt':
              conditions.push(sql`${sql.identifier(key)} < ${val}`);
              break;
            case 'in':
              conditions.push(sql`${sql.identifier(key)} = ANY(${val})`);
              break;
            case 'contains':
              conditions.push(sql`${sql.identifier(key)} ILIKE ${`%${val}%`}`);
              break;
            default:
              conditions.push(eq(sql.identifier(key), val));
          }
        });
      } else {
        conditions.push(eq(sql.identifier(key), value));
      }
    });
    
    return conditions;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { DatabaseQuery, QueryResult, TransactionOptions, TransactionResult } from '../types';

@Injectable()
export class PrismaService {
  private readonly logger = new Logger(PrismaService.name);
  private prisma: PrismaClient;
  private isConnectedFlag = false;

  constructor() {
    this.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
    this.connect();
  }

  async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      this.isConnectedFlag = true;
      this.logger.log('Prisma connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to Prisma', error);
      this.isConnectedFlag = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      this.isConnectedFlag = false;
      this.logger.log('Prisma disconnected successfully');
    } catch (error) {
      this.logger.error('Failed to disconnect from Prisma', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.isConnectedFlag;
  }

  async execute<T = any>(query: DatabaseQuery<T>): Promise<QueryResult<T>> {
    const startTime = Date.now();
    
    try {
      let result: any;
      
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
        provider: 'prisma'
      };

    } catch (error) {
      this.logger.error(`Prisma query execution failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async executeTransaction<T = any>(
    queries: DatabaseQuery[],
    options?: TransactionOptions
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const results = [];
        
        for (const query of queries) {
          const queryResult = await this.executeWithTransaction(tx, query);
          results.push(queryResult);
        }
        
        return results;
      }, {
        timeout: options?.timeout || 10000,
        isolationLevel: this.mapIsolationLevel(options?.isolationLevel)
      });

      return result as T;

    } catch (error) {
      this.logger.error(`Prisma transaction execution failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async executeSelect<T>(query: DatabaseQuery<T>): Promise<T[]> {
    const model = this.getModel(query.table);
    
    const selectOptions: any = {
      where: query.where,
      orderBy: query.orderBy,
      select: query.select ? this.buildSelectObject(query.select) : undefined,
      include: query.include ? this.buildIncludeObject(query.include) : undefined
    };

    // Handle pagination
    if (query.pagination) {
      const { page, limit } = query.pagination;
      const skip = (page - 1) * limit;
      selectOptions.skip = skip;
      selectOptions.take = limit;
    }

    return await model.findMany(selectOptions);
  }

  private async executeInsert<T>(query: DatabaseQuery<T>): Promise<T> {
    const model = this.getModel(query.table);
    
    if (Array.isArray(query.data)) {
      return await model.createMany({
        data: query.data,
        skipDuplicates: true
      }) as T;
    } else {
      return await model.create({
        data: query.data
      }) as T;
    }
  }

  private async executeUpdate<T>(query: DatabaseQuery<T>): Promise<T> {
    const model = this.getModel(query.table);
    
    return await model.update({
      where: query.where,
      data: query.data
    }) as T;
  }

  private async executeDelete<T>(query: DatabaseQuery<T>): Promise<T> {
    const model = this.getModel(query.table);
    
    return await model.delete({
      where: query.where
    }) as T;
  }

  private async executeRaw<T>(query: DatabaseQuery<T>): Promise<T[]> {
    if (!query.sql) {
      throw new Error('Raw SQL query requires sql property');
    }
    
    return await this.prisma.$queryRawUnsafe(query.sql, ...(query.params || [])) as T[];
  }

  private async executeWithTransaction(tx: any, query: DatabaseQuery): Promise<any> {
    const model = tx[query.table];
    
    switch (query.type) {
      case 'select':
        return await model.findMany({
          where: query.where,
          orderBy: query.orderBy,
          select: query.select ? this.buildSelectObject(query.select) : undefined,
          include: query.include ? this.buildIncludeObject(query.include) : undefined
        });
      
      case 'insert':
        if (Array.isArray(query.data)) {
          return await model.createMany({
            data: query.data,
            skipDuplicates: true
          });
        } else {
          return await model.create({
            data: query.data
          });
        }
      
      case 'update':
        return await model.update({
          where: query.where,
          data: query.data
        });
      
      case 'delete':
        return await model.delete({
          where: query.where
        });
      
      case 'raw':
        return await tx.$queryRawUnsafe(query.sql!, ...(query.params || []));
      
      default:
        throw new Error(`Unsupported query type: ${query.type}`);
    }
  }

  private getModel(tableName: string): any {
    const model = (this.prisma as any)[tableName];
    if (!model) {
      throw new Error(`Model ${tableName} not found in Prisma client`);
    }
    return model;
  }

  private buildSelectObject(select: string[]): Record<string, boolean> {
    const selectObj: Record<string, boolean> = {};
    select.forEach(field => {
      selectObj[field] = true;
    });
    return selectObj;
  }

  private buildIncludeObject(include: string[]): Record<string, boolean> {
    const includeObj: Record<string, boolean> = {};
    include.forEach(relation => {
      includeObj[relation] = true;
    });
    return includeObj;
  }

  private mapIsolationLevel(level?: string): any {
    switch (level) {
      case 'read-uncommitted':
        return 'ReadUncommitted';
      case 'read-committed':
        return 'ReadCommitted';
      case 'repeatable-read':
        return 'RepeatableRead';
      case 'serializable':
        return 'Serializable';
      default:
        return 'ReadCommitted';
    }
  }
}

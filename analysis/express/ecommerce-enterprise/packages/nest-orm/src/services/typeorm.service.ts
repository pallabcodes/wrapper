import { Injectable, Logger } from '@nestjs/common';
import { DatabaseQuery, QueryResult, TransactionOptions } from '../types';
import { DataSource, Repository, EntityManager } from 'typeorm';
// import { MoreThan, LessThan, Like, In, Between } from 'typeorm';

@Injectable()
export class TypeOrmService {
  private readonly logger = new Logger(TypeOrmService.name);
  private dataSource!: DataSource;
  private isConnectedFlag = false;

  constructor() {
    this.connect();
  }

  async connect(): Promise<void> {
    try {
      this.dataSource = new DataSource({
        type: 'postgres',
        host: process.env['DB_HOST'] || 'localhost',
        port: parseInt(process.env['DB_PORT'] || '5432'),
        username: process.env['DB_USERNAME'] || 'postgres',
        password: process.env['DB_PASSWORD'] || 'password',
        database: process.env['DB_DATABASE'] || 'ecommerce',
        entities: [], // In real implementation, load entities
        synchronize: process.env['NODE_ENV'] === 'development',
        logging: process.env['NODE_ENV'] === 'development'
      });

      await this.dataSource.initialize();
      this.isConnectedFlag = true;
      this.logger.log('TypeORM connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to TypeORM', error);
      this.isConnectedFlag = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.dataSource.destroy();
      this.isConnectedFlag = false;
      this.logger.log('TypeORM disconnected successfully');
    } catch (error) {
      this.logger.error('Failed to disconnect from TypeORM', error);
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
        provider: 'typeorm'
      };

    } catch (error) {
      this.logger.error(`TypeORM query execution failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  async executeTransaction<T = any>(
    queries: DatabaseQuery[],
    _options?: TransactionOptions
  ): Promise<T> {
    // const startTime = Date.now();
    
    try {
      const result = await this.dataSource.transaction(async (manager: EntityManager) => {
        const results = [];
        
        for (const query of queries) {
          const queryResult = await this.executeWithTransaction(manager, query);
          results.push(queryResult);
        }
        
        return results;
      });

      return result as T;

    } catch (error) {
      this.logger.error(`TypeORM transaction execution failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  private async executeSelect<T>(query: DatabaseQuery<T>): Promise<T[]> {
    const repository = this.getRepository(query.table);
    
    const queryBuilder = repository.createQueryBuilder(query.table);
    
    // Apply where conditions
    if (query.where) {
      this.applyWhereConditions(queryBuilder, query.where);
    }
    
    // Apply ordering
    if (query.orderBy) {
      Object.entries(query.orderBy).forEach(([column, direction]) => {
        queryBuilder.orderBy(`${query.table}.${column}`, direction.toUpperCase() as 'ASC' | 'DESC');
      });
    }
    
    // Apply pagination
    if (query.pagination) {
      const { page, limit } = query.pagination;
      const offset = (page - 1) * limit;
      queryBuilder.skip(offset).take(limit);
    }
    
    // Apply field selection
    if (query.select) {
      queryBuilder.select(query.select.map(field => `${query.table}.${field}`));
    }
    
    // Apply relations
    if (query.include) {
      query.include.forEach(relation => {
        queryBuilder.leftJoinAndSelect(`${query.table}.${relation}`, relation);
      });
    }
    
    return await queryBuilder.getMany();
  }

  private async executeInsert<T>(query: DatabaseQuery<T>): Promise<T> {
    const repository = this.getRepository(query.table);
    
    if (Array.isArray(query.data)) {
      const result = await repository.save(query.data);
      return result as T;
    } else {
      const result = await repository.save(query.data);
      return result as T;
    }
  }

  private async executeUpdate<T>(query: DatabaseQuery<T>): Promise<T> {
    const repository = this.getRepository(query.table);
    
    const queryBuilder = repository.createQueryBuilder()
      .update(query.table)
      .set(query.data || {})
      .where(this.buildWhereClause(query.where || {}));
    
    const result = await queryBuilder.execute();
    return result as T;
  }

  private async executeDelete<T>(query: DatabaseQuery<T>): Promise<T> {
    const repository = this.getRepository(query.table);
    
    const queryBuilder = repository.createQueryBuilder()
      .delete()
      .from(query.table)
      .where(this.buildWhereClause(query.where || {}));
    
    const result = await queryBuilder.execute();
    return result as T;
  }

  private async executeRaw<T>(query: DatabaseQuery<T>): Promise<T[]> {
    if (!query.sql) {
      throw new Error('Raw SQL query requires sql property');
    }
    
    return await this.dataSource.query(query.sql, query.params || []) as T[];
  }

  private async executeWithTransaction(manager: EntityManager, query: DatabaseQuery): Promise<any> {
    const repository = manager.getRepository(query.table);
    
    switch (query.type) {
      case 'select':
        const queryBuilder = repository.createQueryBuilder(query.table);
        
        if (query.where) {
          this.applyWhereConditions(queryBuilder, query.where);
        }
        
        if (query.orderBy) {
          Object.entries(query.orderBy).forEach(([column, direction]) => {
            queryBuilder.orderBy(`${query.table}.${column}`, direction.toUpperCase() as 'ASC' | 'DESC');
          });
        }
        
        if (query.select) {
          queryBuilder.select(query.select.map(field => `${query.table}.${field}`));
        }
        
        if (query.include) {
          query.include.forEach(relation => {
            queryBuilder.leftJoinAndSelect(`${query.table}.${relation}`, relation);
          });
        }
        
        return await queryBuilder.getMany();
      
      case 'insert':
        if (Array.isArray(query.data)) {
          return await repository.save(query.data || []);
        } else {
          return await repository.save(query.data || {});
        }
      
      case 'update':
        const updateBuilder = repository.createQueryBuilder()
          .update(query.table)
          .set(query.data || {})
          .where(this.buildWhereClause(query.where || {}));
        return await updateBuilder.execute();
      
      case 'delete':
        const deleteBuilder = repository.createQueryBuilder()
          .delete()
          .from(query.table)
          .where(this.buildWhereClause(query.where || {}));
        return await deleteBuilder.execute();
      
      case 'raw':
        return await manager.query(query.sql!, query.params || []);
      
      default:
        throw new Error(`Unsupported query type: ${query.type}`);
    }
  }

  private getRepository(tableName: string): Repository<any> {
    // In a real implementation, you would have entity registry
    // For now, we'll use a simple approach
    return this.dataSource.getRepository(tableName);
  }

  private applyWhereConditions(queryBuilder: any, where: Record<string, any>): void {
    Object.entries(where).forEach(([key, _value], index) => {
      const parameterName = `param${index}`;
      
      if (typeof _value === 'object' && _value !== null) {
        Object.entries(_value).forEach(([operator, _val]) => {
          switch (operator) {
            case 'gte':
              queryBuilder.andWhere(`${key} >= :${parameterName}`, { [parameterName]: _val });
              break;
            case 'lte':
              queryBuilder.andWhere(`${key} <= :${parameterName}`, { [parameterName]: _val });
              break;
            case 'gt':
              queryBuilder.andWhere(`${key} > :${parameterName}`, { [parameterName]: _val });
              break;
            case 'lt':
              queryBuilder.andWhere(`${key} < :${parameterName}`, { [parameterName]: _val });
              break;
            case 'in':
              queryBuilder.andWhere(`${key} IN (:...${parameterName})`, { [parameterName]: _val });
              break;
            case 'contains':
              queryBuilder.andWhere(`${key} ILIKE :${parameterName}`, { [parameterName]: `%${_val}%` });
              break;
            default:
              queryBuilder.andWhere(`${key} = :${parameterName}`, { [parameterName]: _val });
          }
        });
      } else {
        queryBuilder.andWhere(`${key} = :${parameterName}`, { [parameterName]: _value });
      }
    });
  }

  private buildWhereClause(where: Record<string, any>): string {
    const conditions: string[] = [];
    
    Object.entries(where).forEach(([key, _value], index) => {
      const parameterName = `param${index}`;
      
      if (typeof _value === 'object' && _value !== null) {
        Object.entries(_value).forEach(([operator, _val]) => {
          switch (operator) {
            case 'gte':
              conditions.push(`${key} >= :${parameterName}`);
              break;
            case 'lte':
              conditions.push(`${key} <= :${parameterName}`);
              break;
            case 'gt':
              conditions.push(`${key} > :${parameterName}`);
              break;
            case 'lt':
              conditions.push(`${key} < :${parameterName}`);
              break;
            case 'in':
              conditions.push(`${key} IN (:...${parameterName})`);
              break;
            case 'contains':
              conditions.push(`${key} ILIKE :${parameterName}`);
              break;
            default:
              conditions.push(`${key} = :${parameterName}`);
          }
        });
      } else {
        conditions.push(`${key} = :${parameterName}`);
      }
    });
    
    return conditions.join(' AND ');
  }
}

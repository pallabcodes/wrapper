/**
 * Base Repository - Functional Programming Pattern
 * 
 * Pure functions for database operations following FP principles.
 * No classes, no instantiation - just pure functions.
 */

import { eq, and, like, gte, lte, desc, asc, sql, count } from 'drizzle-orm';
import type { PgTableWithColumns } from 'drizzle-orm/pg-core';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { db } from '../client';

// ============================================================================
// TYPES
// ============================================================================

type DrizzleTable = PgTableWithColumns<any> & {
  [key: string]: AnyPgColumn | unknown;
  id: AnyPgColumn;
};

export interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: {
    field: string
    direction: 'asc' | 'desc'
  }
  where?: Record<string, unknown>
}

export interface RepositoryResult<T> {
  success: boolean
  data?: T | undefined
  error?: string | undefined
}

// ============================================================================
// BASE REPOSITORY FUNCTIONS
// ============================================================================

export const createRecord = async <T>(
  table: DrizzleTable,
  data: Record<string, unknown>,
  tableName: string
): Promise<RepositoryResult<T>> => {
  try {
    const startTime = Date.now()
    const result = await db.insert(table).values(data).returning()
    const duration = Date.now() - startTime
    
    const resultArray = Array.isArray(result) ? result : []
    if (resultArray.length > 0) {
      console.log(`Created ${tableName} record`, { 
        id: resultArray[0]?.['id'], 
        duration 
      })
      return { success: true, data: resultArray[0] as T }
    }
    
    return { success: false, error: 'Failed to create record' }
  } catch (error) {
    console.error(`Failed to create ${tableName} record`, { error, data })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export const findRecordById = async <T>(
  table: DrizzleTable,
  id: string,
  tableName: string
): Promise<RepositoryResult<T>> => {
  try {
    const startTime = Date.now();
    const idCol = (table as any)['id'] as any;
    const result = await (db as any).select().from(table as any).where(eq(idCol, id as any)).limit(1);
    const duration = Date.now() - startTime;
    
    const resultArray = Array.isArray(result) ? result : []
    if (resultArray.length > 0) {
      console.log(`Found ${tableName} record`, { id, duration })
      return { success: true, data: resultArray[0] as T }
    }
    
    console.warn(`${tableName} record not found`, { id })
    return { success: false, error: 'Record not found' }
  } catch (error) {
    console.error(`Failed to find ${tableName} record`, { error, id })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export const findRecords = async <T>(
  table: DrizzleTable,
  options: QueryOptions = {},
  tableName: string
): Promise<RepositoryResult<T[]>> => {
  try {
    const startTime = Date.now();
    let query: any = (db as any).select().from(table as any);
    
    // Apply where conditions
    if (options.where) {
      const conditions = buildWhereConditions(table, options.where)
      if (conditions.length > 0) {
        query = query.where(and(...conditions))
      }
    }
    
    // Apply ordering
    if (options.orderBy) {
      const orderField = (table as any)[options.orderBy.field as keyof typeof table] as any;
      if (orderField) {
        if (options.orderBy.direction === 'desc') {
          query = query.orderBy(desc(orderField));
        } else {
          query = query.orderBy(asc(orderField));
        }
      }
    }
    
    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.offset(options.offset);
    }
    
    const result = await query
    const duration = Date.now() - startTime
    
    const resultArray = Array.isArray(result) ? result : []
    console.log(`Found ${tableName} records`, { 
      count: resultArray.length, 
      duration 
    })
    
    return { success: true, data: resultArray as T[] }
  } catch (error) {
    console.error(`Failed to find ${tableName} records`, { error, options })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export const updateRecord = async <T>(
  table: DrizzleTable,
  id: string,
  data: Partial<Record<string, unknown>>,
  tableName: string
): Promise<RepositoryResult<T>> => {
  try {
    const startTime = Date.now();
    const idCol = (table as any)['id'] as any;
    const result = await (db as any)
      .update(table as any)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(idCol, id as any))
      .returning();
    const duration = Date.now() - startTime;
    
    const resultArray = Array.isArray(result) ? result : []
    if (resultArray.length > 0) {
      console.log(`Updated ${tableName} record`, { id, duration })
      return { success: true, data: resultArray[0] as T }
    }
    
    console.warn(`${tableName} record not found for update`, { id })
    return { success: false, error: 'Record not found' }
  } catch (error) {
    console.error(`Failed to update ${tableName} record`, { error, id, data })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export const deleteRecord = async (
  table: DrizzleTable,
  id: string,
  tableName: string
): Promise<RepositoryResult<boolean>> => {
  try {
    const startTime = Date.now()
    const idCol = (table as any)['id'] as any;
    const result = await (db as any)
      .delete(table as any)
      .where(eq(idCol, id as any))
      .returning()
    const duration = Date.now() - startTime
    
    const resultArray = Array.isArray(result) ? result : []
    if (resultArray.length > 0) {
      console.log(`Deleted ${tableName} record`, { id, duration })
      return { success: true, data: true }
    }
    
    console.warn(`${tableName} record not found for deletion`, { id })
    return { success: false, error: 'Record not found' }
  } catch (error) {
    console.error(`Failed to delete ${tableName} record`, { error, id })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export const countRecords = async (
  table: DrizzleTable,
  tableName: string,
  where?: Record<string, unknown>
): Promise<RepositoryResult<number>> => {
  try {
    const startTime = Date.now();
    let query: any = (db as any).select({ count: count() }).from(table as any);
    
    if (where) {
      const conditions = buildWhereConditions(table, where);
      if (conditions.length > 0) {
        query = query.where(and(...conditions as any));
      }
    }
    
    const result = await query;
    const duration = Date.now() - startTime;
    
    const resultArray = Array.isArray(result) ? result : []
    const countValue = resultArray[0]?.count || 0
    console.log(`Counted ${tableName} records`, { 
      count: countValue, 
      duration 
    })
    
    return { success: true, data: countValue }
  } catch (error) {
    console.error(`Failed to count ${tableName} records`, { error, where })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const buildWhereConditions = (table: DrizzleTable, where: Record<string, unknown>): any[] => {
  const conditions: any[] = [];
  
  for (const [key, value] of Object.entries(where)) {
    const field = (table as any)[key];
    if (field && value !== undefined && value !== null) {
      if (typeof value === 'string' && value.includes('%')) {
        conditions.push(like(field as any, value as any));
      } else {
        conditions.push(eq(field as any, value as any));
      }
    }
  }
  
  return conditions;
}

export const buildAdvancedWhereConditions = (
  table: DrizzleTable,
  conditions: Array<{
    field: string
    operator: 'eq' | 'like' | 'gte' | 'lte' | 'in'
    value: unknown
  }>
): any[] => {
  return conditions.map(({ field, operator, value }) => {
    const tableField = (table as any)[field];
    if (!tableField) return null;
    
    switch (operator) {
      case 'eq':
        return eq(tableField as any, value as any);
      case 'like':
        return like(tableField as any, value as any);
      case 'gte':
        return gte(tableField as any, value as any);
      case 'lte':
        return lte(tableField as any, value as any);
      case 'in':
        return sql`${tableField} IN (${(value as any as unknown[]).join(',')})`;
      default:
        return null;
    }
  }).filter(Boolean) as any[];
}

// ============================================================================
// MONGODB BASE FUNCTIONS (Functional Pattern)
// ============================================================================

interface MongooseQuery<T = unknown> {
  sort(sort: Record<string, number>): MongooseQuery<T>
  limit(limit: number): MongooseQuery<T>
  skip(offset: number): MongooseQuery<T>
  lean(): Promise<T[]>
}

interface MongooseModel {
  new (data: Record<string, unknown>): {
    save(): Promise<{ _id: unknown; toObject(): unknown }>;
  };
  findById(id: string): Promise<{ toObject(): unknown } | null>;
  find(filter: Record<string, unknown>): MongooseQuery;
  findByIdAndUpdate(id: string, data: Record<string, unknown>, options: { new: boolean }): Promise<{ toObject(): unknown } | null>;
  findByIdAndDelete(id: string): Promise<{ _id: unknown } | null>;
}

export const createMongoRecord = async <T>(
  model: MongooseModel,
  data: Record<string, unknown>,
  modelName: string
): Promise<RepositoryResult<T>> => {
  try {
    const startTime = Date.now()
    const record = new model(data)
    const result = await record.save()
    const duration = Date.now() - startTime
    
    console.log(`Created ${modelName} record`, { 
      id: result._id, 
      duration 
    })
    
    return { success: true, data: result.toObject() as T }
  } catch (error) {
    console.error(`Failed to create ${modelName} record`, { error, data })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export const findMongoRecordById = async <T>(
  model: MongooseModel,
  id: string,
  modelName: string
): Promise<RepositoryResult<T>> => {
  try {
    const startTime = Date.now()
    const result = await model.findById(id)
    const duration = Date.now() - startTime
    
    if (!result) {
      console.warn(`${modelName} record not found`, { id })
      return { success: false, error: 'Record not found' }
    }
    
    console.log(`Found ${modelName} record`, { id, duration })
    return { success: true, data: result.toObject() as T }
  } catch (error) {
    console.error(`Failed to find ${modelName} record`, { error, id })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export const findMongoRecords = async <T>(
  model: MongooseModel,
  filter: Record<string, unknown> = {},
  options: QueryOptions = {},
  modelName: string
): Promise<RepositoryResult<T[]>> => {
  try {
    const startTime = Date.now()
    let query: MongooseQuery<T> = model.find(filter) as MongooseQuery<T>
    
    // Apply ordering
    if (options.orderBy) {
      const sort = { [options.orderBy.field]: options.orderBy.direction === 'desc' ? -1 : 1 }
      query = query.sort(sort)
    }
    
    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit)
    }
    if (options.offset) {
      query = query.skip(options.offset)
    }
    
    const result = await query.lean()
    const duration = Date.now() - startTime
    
    const resultArray = Array.isArray(result) ? result : []
    console.log(`Found ${modelName} records`, { 
      count: resultArray.length, 
      duration 
    })
    
    return { success: true, data: resultArray as T[] }
  } catch (error) {
    console.error(`Failed to find ${modelName} records`, { error, filter, options })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export const updateMongoRecord = async <T>(
  model: MongooseModel,
  id: string,
  data: Partial<Record<string, unknown>>,
  modelName: string
): Promise<RepositoryResult<T>> => {
  try {
    const startTime = Date.now()
    const result = await model.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true }
    )
    const duration = Date.now() - startTime
    
    if (!result) {
      console.warn(`${modelName} record not found for update`, { id })
      return { success: false, error: 'Record not found' }
    }
    
    console.log(`Updated ${modelName} record`, { id, duration })
    return { success: true, data: result.toObject() as T }
  } catch (error) {
    console.error(`Failed to update ${modelName} record`, { error, id, data })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export const deleteMongoRecord = async (
  model: MongooseModel,
  id: string,
  modelName: string
): Promise<RepositoryResult<boolean>> => {
  try {
    const startTime = Date.now()
    const result = await model.findByIdAndDelete(id)
    const duration = Date.now() - startTime
    
    if (!result) {
      console.warn(`${modelName} record not found for deletion`, { id })
      return { success: false, error: 'Record not found' }
    }
    
    console.log(`Deleted ${modelName} record`, { id, duration })
    return { success: true, data: true }
  } catch (error) {
    console.error(`Failed to delete ${modelName} record`, { error, id })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Base Repository - Functional Programming Pattern
 * 
 * Pure functions for database operations following FP principles.
 * No classes, no instantiation - just pure functions.
 */

import { eq, and, like, gte, lte, desc, asc, sql, count } from 'drizzle-orm'
import { db } from '../client'

// ============================================================================
// TYPES
// ============================================================================

export interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: {
    field: string
    direction: 'asc' | 'desc'
  }
  where?: Record<string, any>
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
  table: any,
  data: any,
  tableName: string
): Promise<RepositoryResult<T>> => {
  try {
    const startTime = Date.now()
    const result = await db.insert(table).values(data).returning()
    const duration = Date.now() - startTime
    
    const resultArray = Array.isArray(result) ? result : []
    if (resultArray.length > 0) {
      console.log(`Created ${tableName} record`, { 
        id: resultArray[0]?.id, 
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
  table: any,
  id: string,
  tableName: string
): Promise<RepositoryResult<T>> => {
  try {
    const startTime = Date.now()
    const result = await db.select().from(table).where(eq(table.id, id)).limit(1)
    const duration = Date.now() - startTime
    
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
  table: any,
  options: QueryOptions = {},
  tableName: string
): Promise<RepositoryResult<T[]>> => {
  try {
    const startTime = Date.now()
    let query = db.select().from(table)
    
    // Apply where conditions
    if (options.where) {
      const conditions = buildWhereConditions(table, options.where)
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any
      }
    }
    
    // Apply ordering
    if (options.orderBy) {
      const orderField = table[options.orderBy.field as keyof typeof table]
      if (orderField) {
        if (options.orderBy.direction === 'desc') {
          query = query.orderBy(desc(orderField)) as any
        } else {
          query = query.orderBy(asc(orderField)) as any
        }
      }
    }
    
    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit) as any
    }
    if (options.offset) {
      query = query.offset(options.offset) as any
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
  table: any,
  id: string,
  data: Partial<any>,
  tableName: string
): Promise<RepositoryResult<T>> => {
  try {
    const startTime = Date.now()
    const result = await db
      .update(table)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(table.id, id))
      .returning()
    const duration = Date.now() - startTime
    
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
  table: any,
  id: string,
  tableName: string
): Promise<RepositoryResult<boolean>> => {
  try {
    const startTime = Date.now()
    const result = await db
      .delete(table)
      .where(eq(table.id, id))
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
  table: any,
  tableName: string,
  where?: Record<string, any>
): Promise<RepositoryResult<number>> => {
  try {
    const startTime = Date.now()
    let query = db.select({ count: count() }).from(table)
    
    if (where) {
      const conditions = buildWhereConditions(table, where)
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any
      }
    }
    
    const result = await query
    const duration = Date.now() - startTime
    
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

export const buildWhereConditions = (table: any, where: Record<string, any>) => {
  const conditions = []
  
  for (const [key, value] of Object.entries(where)) {
    const field = table[key as keyof typeof table]
    if (field && value !== undefined && value !== null) {
      if (typeof value === 'string' && value.includes('%')) {
        conditions.push(like(field, value))
      } else {
        conditions.push(eq(field, value))
      }
    }
  }
  
  return conditions
}

export const buildAdvancedWhereConditions = (
  table: any,
  conditions: Array<{
    field: string
    operator: 'eq' | 'like' | 'gte' | 'lte' | 'in'
    value: any
  }>
) => {
  return conditions.map(({ field, operator, value }) => {
    const tableField = table[field as keyof typeof table]
    if (!tableField) return null
    
    switch (operator) {
      case 'eq':
        return eq(tableField, value)
      case 'like':
        return like(tableField, value)
      case 'gte':
        return gte(tableField, value)
      case 'lte':
        return lte(tableField, value)
      case 'in':
        return sql`${tableField} IN (${value.join(',')})`
      default:
        return null
    }
  }).filter(Boolean)
}

// ============================================================================
// MONGODB BASE FUNCTIONS (Functional Pattern)
// ============================================================================

export const createMongoRecord = async <T>(
  model: any,
  data: any,
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
  model: any,
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
  model: any,
  filter: Record<string, any> = {},
  options: QueryOptions = {},
  modelName: string
): Promise<RepositoryResult<T[]>> => {
  try {
    const startTime = Date.now()
    let query = model.find(filter)
    
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
  model: any,
  id: string,
  data: Partial<any>,
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
  model: any,
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

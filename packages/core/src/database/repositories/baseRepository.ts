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
    if (options.where && Object.keys(options.where).length > 0) {
      const conditions: any[] = []
      
      for (const [key, value] of Object.entries(options.where)) {
        const field = table[key as keyof typeof table]
        if (field && value !== undefined) {
          if (typeof value === 'string' && value.includes('%')) {
            conditions.push(like(field as any, value))
          } else {
            conditions.push(eq(field as any, value))
          }
        }
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions))
      }
    }
    
    // Apply ordering
    if (options.orderBy) {
      const field = table[options.orderBy.field as keyof typeof table]
      if (field) {
        if (options.orderBy.direction === 'desc') {
          query = query.orderBy(desc(field as any)) as any
        } else {
          query = query.orderBy(asc(field as any)) as any
        }
      }
    }
    
    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit)
    }
    
    if (options.offset) {
      query = query.offset(options.offset)
    }
    
    const result = await query
    const duration = Date.now() - startTime
    
    const resultArray = Array.isArray(result) ? result : []
    console.log(`Found ${resultArray.length} ${tableName} records`, { duration })
    
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
  data: any,
  tableName: string
): Promise<RepositoryResult<T>> => {
  try {
    const startTime = Date.now()
    const result = await db.update(table)
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
): Promise<RepositoryResult<void>> => {
  try {
    const startTime = Date.now()
    const result = await db.delete(table)
      .where(eq(table.id, id))
      .returning()
    const duration = Date.now() - startTime
    
    const resultArray = Array.isArray(result) ? result : []
    if (resultArray.length > 0) {
      console.log(`Deleted ${tableName} record`, { id, duration })
      return { success: true }
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
  where?: Record<string, any>,
  tableName: string
): Promise<RepositoryResult<number>> => {
  try {
    const startTime = Date.now()
    let query = db.select({ count: count() }).from(table)
    
    if (where && Object.keys(where).length > 0) {
      const conditions: any[] = []
      
      for (const [key, value] of Object.entries(where)) {
        const field = table[key as keyof typeof table]
        if (field && value !== undefined) {
          conditions.push(eq(field as any, value))
        }
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions))
      }
    }
    
    const result = await query
    const duration = Date.now() - startTime
    
    const countValue = result[0]?.count || 0
    console.log(`Counted ${countValue} ${tableName} records`, { duration })
    
    return { success: true, data: Number(countValue) }
  } catch (error) {
    console.error(`Failed to count ${tableName} records`, { error, where })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export const executeTransaction = async <T>(
  callback: (tx: any) => Promise<T>
): Promise<RepositoryResult<T>> => {
  try {
    const result = await db.transaction(callback)
    return { success: true, data: result }
  } catch (error) {
    console.error('Transaction failed', { error })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}




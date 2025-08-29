/**
 * Auth Repository - Functional Programming Pattern
 * 
 * Pure functions for user database operations.
 * Following internal team patterns for enterprise applications.
 */

import { eq, like, or, desc, asc } from 'drizzle-orm'
import { db } from '../../database/client'
import { users, User, NewUser } from '../../database/schema'
import { 
  createRecord, 
  findRecordById, 
  findRecords, 
  updateRecord, 
  deleteRecord, 
  countRecords,
  RepositoryResult,
  QueryOptions 
} from '../../database/repositories/baseRepository'

// ============================================================================
// AUTH REPOSITORY FUNCTIONS
// ============================================================================

export const createUser = async (data: NewUser): Promise<RepositoryResult<User>> => {
  try {
    // Check for duplicate email
    const existingUser = await findUserByEmail(data.email)
    if (existingUser.success && existingUser.data) {
      return { 
        success: false, 
        error: `User with email ${data.email} already exists` 
      }
    }

    return await createRecord(users, data, 'users')
  } catch (error) {
    console.error('Failed to create user', { error, data })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export const findUserById = async (id: string): Promise<RepositoryResult<User>> => {
  return await findRecordById(users, id, 'users')
}

export const findUserByEmail = async (email: string): Promise<RepositoryResult<User>> => {
  try {
    const startTime = Date.now()
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1)
    const duration = Date.now() - startTime
    
    const resultArray = Array.isArray(result) ? result : []
    if (resultArray.length > 0) {
      console.log('Found user by email', { email, duration })
      return { success: true, data: resultArray[0] }
    }
    
    console.log('User not found by email', { email })
    return { success: false, error: 'User not found' }
  } catch (error) {
    console.error('Failed to find user by email', { error, email })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export const findUsersByRole = async (
  role: string,
  options: QueryOptions = {}
): Promise<RepositoryResult<User[]>> => {
  const queryOptions: QueryOptions = {
    ...options,
    where: { role }
  }
  return await findRecords(users, queryOptions, 'users')
}

export const searchUsers = async (
  query: string,
  options: QueryOptions = {}
): Promise<RepositoryResult<User[]>> => {
  try {
    const startTime = Date.now()
    const searchTerm = `%${query}%`
    let dbQuery = db.select().from(users).where(
      or(
        like(users.firstName, searchTerm),
        like(users.lastName, searchTerm),
        like(users.email, searchTerm)
      )
    )
    
    // Apply ordering
    if (options.orderBy) {
      // Simple ordering - in production, validate field names
      if (options.orderBy.field === 'createdAt') {
        if (options.orderBy.direction === 'desc') {
          dbQuery = dbQuery.orderBy(desc(users.createdAt)) as any
        } else {
          dbQuery = dbQuery.orderBy(asc(users.createdAt)) as any
        }
      } else if (options.orderBy.field === 'email') {
        if (options.orderBy.direction === 'desc') {
          dbQuery = dbQuery.orderBy(desc(users.email)) as any
        } else {
          dbQuery = dbQuery.orderBy(asc(users.email)) as any
        }
      }
    }
    
    if (options.limit) {
      dbQuery = dbQuery.limit(options.limit) as any
    }
    if (options.offset) {
      dbQuery = dbQuery.offset(options.offset) as any
    }
    
    const result = await dbQuery
    const duration = Date.now() - startTime
    
    const resultArray = Array.isArray(result) ? result : []
    console.log('User search completed', { 
      count: resultArray.length, 
      query, 
      duration 
    })
    
    return { success: true, data: resultArray }
  } catch (error) {
    console.error('Failed to search users', { error, query })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export const updateUser = async (
  id: string,
  data: Partial<User>
): Promise<RepositoryResult<User>> => {
  try {
    // Check for duplicate email if updating email
    if (data.email) {
      const existingUser = await findUserByEmail(data.email)
      if (existingUser.success && existingUser.data && existingUser.data.id !== id) {
        return { 
          success: false, 
          error: `User with email ${data.email} already exists` 
        }
      }
    }

    return await updateRecord(users, id, data, 'users')
  } catch (error) {
    console.error('Failed to update user', { error, id, data })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export const updateLastLogin = async (id: string): Promise<RepositoryResult<User>> => {
  try {
    const startTime = Date.now()
    const result = await db
      .update(users)
      .set({ 
        lastLoginAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning()
    const duration = Date.now() - startTime
    
    const resultArray = Array.isArray(result) ? result : []
    if (resultArray.length > 0) {
      console.log('Updated user last login', { id, duration })
      return { success: true, data: resultArray[0] }
    }
    
    console.warn('User not found for last login update', { id })
    return { success: false, error: 'User not found' }
  } catch (error) {
    console.error('Failed to update user last login', { error, id })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export const deactivateUser = async (id: string): Promise<RepositoryResult<User>> => {
  return await updateUser(id, { isActive: false })
}

export const activateUser = async (id: string): Promise<RepositoryResult<User>> => {
  return await updateUser(id, { isActive: true })
}

export const deleteUser = async (id: string): Promise<RepositoryResult<boolean>> => {
  return await deleteRecord(users, id, 'users')
}

export const countUsersByRole = async (role: string): Promise<RepositoryResult<number>> => {
  return await countRecords(users, 'users', { role })
}

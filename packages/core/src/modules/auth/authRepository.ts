/**
 * Auth Repository - Functional Programming Pattern
 * 
 * Pure functions for authentication database operations following FP principles.
 */

import { eq, and, like, desc, asc } from 'drizzle-orm'
import { users } from '../../database/schema/users'
import { 
  createRecord, 
  findRecordById, 
  findRecords, 
  updateRecord, 
  deleteRecord, 
  countRecords,
  type QueryOptions,
  type RepositoryResult 
} from '../../database/repositories/baseRepository'
import type { User, CreateUserData, UpdateUserData } from './authTypes'

// ============================================================================
// AUTH REPOSITORY FUNCTIONS
// ============================================================================

export const createUser = async (data: CreateUserData): Promise<RepositoryResult<User>> => {
  return createRecord(users, data, 'user')
}

export const findUserById = async (id: string): Promise<RepositoryResult<User>> => {
  return findRecordById(users, id, 'user')
}

export const findUsers = async (options: QueryOptions = {}): Promise<RepositoryResult<User[]>> => {
  return findRecords(users, options, 'user')
}

export const updateUser = async (id: string, data: UpdateUserData): Promise<RepositoryResult<User>> => {
  return updateRecord(users, id, data, 'user')
}

export const deleteUser = async (id: string): Promise<RepositoryResult<void>> => {
  return deleteRecord(users, id, 'user')
}

export const countUsers = async (where?: Record<string, any>): Promise<RepositoryResult<number>> => {
  return countRecords(users, where, 'user')
}

// ============================================================================
// AUTH-SPECIFIC QUERIES
// ============================================================================

export const findUserByEmail = async (email: string): Promise<RepositoryResult<User>> => {
  try {
    const startTime = Date.now()
    const result = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
    const duration = Date.now() - startTime
    
    const resultArray = Array.isArray(result) ? result : []
    if (resultArray.length > 0) {
      console.log(`Found user by email`, { email, duration })
      return { success: true, data: resultArray[0] as User }
    }
    
    console.warn(`User not found by email`, { email })
    return { success: false, error: 'User not found' }
  } catch (error) {
    console.error(`Failed to find user by email`, { error, email })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export const findUsersByRole = async (role: string): Promise<RepositoryResult<User[]>> => {
  return findUsers({ where: { role } })
}

export const findActiveUsers = async (): Promise<RepositoryResult<User[]>> => {
  return findUsers({ where: { isActive: true } })
}

export const updateUserLastLogin = async (id: string): Promise<RepositoryResult<User>> => {
  try {
    const startTime = Date.now()
    const result = await db.update(users)
      .set({ 
        lastLoginAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning()
    const duration = Date.now() - startTime
    
    const resultArray = Array.isArray(result) ? result : []
    if (resultArray.length > 0) {
      console.log(`Updated user last login`, { id, duration })
      return { success: true, data: resultArray[0] as User }
    }
    
    return { success: false, error: 'User not found' }
  } catch (error) {
    console.error(`Failed to update user last login`, { error, id })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export const updateUserPassword = async (id: string, hashedPassword: string): Promise<RepositoryResult<User>> => {
  try {
    const startTime = Date.now()
    const result = await db.update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning()
    const duration = Date.now() - startTime
    
    const resultArray = Array.isArray(result) ? result : []
    if (resultArray.length > 0) {
      console.log(`Updated user password`, { id, duration })
      return { success: true, data: resultArray[0] as User }
    }
    
    return { success: false, error: 'User not found' }
  } catch (error) {
    console.error(`Failed to update user password`, { error, id })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export const verifyUserEmail = async (id: string): Promise<RepositoryResult<User>> => {
  try {
    const startTime = Date.now()
    const result = await db.update(users)
      .set({ 
        isEmailVerified: true,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning()
    const duration = Date.now() - startTime
    
    const resultArray = Array.isArray(result) ? result : []
    if (resultArray.length > 0) {
      console.log(`Verified user email`, { id, duration })
      return { success: true, data: resultArray[0] as User }
    }
    
    return { success: false, error: 'User not found' }
  } catch (error) {
    console.error(`Failed to verify user email`, { error, id })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export const deactivateUser = async (id: string): Promise<RepositoryResult<User>> => {
  try {
    const startTime = Date.now()
    const result = await db.update(users)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning()
    const duration = Date.now() - startTime
    
    const resultArray = Array.isArray(result) ? result : []
    if (resultArray.length > 0) {
      console.log(`Deactivated user`, { id, duration })
      return { success: true, data: resultArray[0] as User }
    }
    
    return { success: false, error: 'User not found' }
  } catch (error) {
    console.error(`Failed to deactivate user`, { error, id })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export const getUserStats = async (): Promise<RepositoryResult<{
  totalUsers: number
  activeUsers: number
  verifiedUsers: number
  usersByRole: Record<string, number>
}>> => {
  try {
    const startTime = Date.now()
    
    // Get total users
    const totalResult = await countUsers()
    const totalUsers = totalResult.success ? totalResult.data || 0 : 0
    
    // Get active users
    const activeResult = await countUsers({ isActive: true })
    const activeUsers = activeResult.success ? activeResult.data || 0 : 0
    
    // Get verified users
    const verifiedResult = await countUsers({ isEmailVerified: true })
    const verifiedUsers = verifiedResult.success ? verifiedResult.data || 0 : 0
    
    // Get users by role
    const rolesResult = await db.select({ role: users.role })
      .from(users)
      .groupBy(users.role)
    
    const usersByRole: Record<string, number> = {}
    if (Array.isArray(rolesResult)) {
      for (const roleData of rolesResult) {
        const roleCountResult = await countUsers({ role: roleData.role })
        usersByRole[roleData.role] = roleCountResult.success ? roleCountResult.data || 0 : 0
      }
    }
    
    const duration = Date.now() - startTime
    console.log('Generated user stats', { duration })
    
    return {
      success: true,
      data: {
        totalUsers,
        activeUsers,
        verifiedUsers,
        usersByRole
      }
    }
  } catch (error) {
    console.error('Failed to get user stats', { error })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Import missing dependencies
import { db } from '../../database/client'

/**
 * Database - Central Export File
 * 
 * Centralized exports for all database-related components.
 * Following internal team patterns for enterprise applications.
 */

import { checkDatabaseHealth, closeDatabaseConnection } from './client'
import { connectMongoDB, closeMongoConnection } from './mongodb/client'

// ============================================================================
// POSTGRESQL (DRIZZLE) EXPORTS
// ============================================================================

// Schema exports
export * from './schema'

// Client and connection utilities
export { db, pool, getDatabaseClient, withTransaction, runMigrations, checkDatabaseHealth } from './client'

// Base repository functions (functional pattern)
export { 
  createRecord, 
  findRecordById, 
  findRecords, 
  updateRecord, 
  deleteRecord, 
  countRecords,
  buildWhereConditions,
  buildAdvancedWhereConditions,
  RepositoryResult,
  QueryOptions 
} from './repositories/baseRepository'

// MongoDB functions (functional pattern)
export {
  createMongoRecord,
  findMongoRecordById,
  findMongoRecords,
  updateMongoRecord,
  deleteMongoRecord
} from './repositories/baseRepository'

// ============================================================================
// MONGODB (MONGOOSE) EXPORTS
// ============================================================================

// Client and connection utilities
export { getMongoClient, checkMongoHealth, mongoose } from './mongodb/client'

// Schema and model exports
export * from './mongodb/schema'

// ============================================================================
// MIGRATION EXPORTS
// ============================================================================

export { default as drizzleConfig } from './migrations/drizzle.config'

// ============================================================================
// DATABASE INITIALIZATION/CLEANUP
// ============================================================================

export const initializeDatabase = async () => {
  try {
    // Initialize PostgreSQL
    await checkDatabaseHealth()
    
    // Initialize MongoDB if configured
    if (process.env['MONGODB_URI']) {
      await connectMongoDB()
    }
    
    console.log('Database connections established successfully')
  } catch (error) {
    console.error('Failed to initialize database connections:', error)
    throw error
  }
}

export const cleanupDatabase = async () => {
  try {
    // Close PostgreSQL connection
    await closeDatabaseConnection()
    
    // Close MongoDB connection if connected
    await closeMongoConnection()
    
    console.log('Database connections closed successfully')
  } catch (error) {
    console.error('Failed to cleanup database connections:', error)
    throw error
  }
}

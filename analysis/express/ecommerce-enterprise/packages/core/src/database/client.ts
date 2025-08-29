/**
 * Database Client - PostgreSQL with Drizzle ORM
 * 
 * Database connection and client setup for PostgreSQL.
 * Following internal team patterns for enterprise applications.
 */

import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

// ============================================================================
// DATABASE CONFIGURATION
// ============================================================================

const pool = new Pool({
  host: process.env['DATABASE_HOST'] || 'localhost',
  port: parseInt(process.env['DATABASE_PORT'] || '5432'),
  user: process.env['DATABASE_USER'] || 'postgres',
  password: process.env['DATABASE_PASSWORD'] || 'postgres',
  database: process.env['DATABASE_NAME'] || 'ecommerce',
  ssl: process.env['NODE_ENV'] === 'production' ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env['DATABASE_POOL_MAX'] || '20'),
  min: parseInt(process.env['DATABASE_POOL_MIN'] || '5'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
})

// ============================================================================
// DRIZZLE CLIENT
// ============================================================================

export const db = drizzle(pool, {
  logger: process.env['NODE_ENV'] === 'development',
  schema: {} // Schema will be imported and configured separately
})

// ============================================================================
// CLIENT UTILITIES
// ============================================================================

export const getDatabaseClient = () => db

export const closeDatabaseConnection = async () => {
  try {
    await pool.end()
    console.log('Database connection pool closed')
  } catch (error) {
    console.error('Failed to close database connection', { error })
    throw error
  }
}

export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const client = await pool.connect()
    await client.query('SELECT 1')
    client.release()
    return true
  } catch (error) {
    console.error('Database health check failed', { error })
    return false
  }
}

export const withTransaction = async <T>(operation: (tx: typeof db) => Promise<T>): Promise<T> => {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')
    const result = await operation(db)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export const runMigrations = async (): Promise<void> => {
  // This would typically use drizzle-kit or a migration runner
  // For now, we'll log that migrations should be run manually
  console.log('Migrations should be run using: npm run db:migrate')
}

// ============================================================================
// EXPORTS
// ============================================================================

export { pool }

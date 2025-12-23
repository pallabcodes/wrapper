/**
 * Global Test Setup - Enterprise Grade Testing
 * 
 * Sets up test environment, databases, and global configurations.
 * Following internal team testing standards.
 */

import { config } from 'dotenv'
import { pool, closeDatabaseConnection } from '../database/client'
import { connectMongoDB, closeMongoConnection } from '../database/mongodb/client'

// Load environment variables for testing
config({ path: '.env.test' })

export default async function globalSetup() {
  console.log('🧪 Setting up global test environment...')
  
  try {
    // Test database connections
    const client = await pool.connect()
    await client.query('SELECT 1')
    client.release()
    
    await connectMongoDB()
    
    console.log('✅ Global test setup completed')
  } catch (error) {
    console.error('❌ Global test setup failed:', error)
    throw error
  }
}

// Cleanup function for global teardown
export async function globalTeardown() {
  console.log('🧹 Cleaning up global test environment...')
  
  try {
    // Close database connections
    await closeDatabaseConnection()
    await closeMongoConnection()
    
    console.log('✅ Global test cleanup completed')
  } catch (error) {
    console.error('❌ Global test cleanup failed:', error)
  }
}

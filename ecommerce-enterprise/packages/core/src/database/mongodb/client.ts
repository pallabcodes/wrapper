/**
 * MongoDB Client - Mongoose ORM
 * 
 * MongoDB connection and client setup using Mongoose.
 * Following internal team patterns for enterprise applications.
 */

import mongoose from 'mongoose'

// ============================================================================
// MONGODB CONNECTION
// ============================================================================

let mongoClient: typeof mongoose

export const connectMongoDB = async (): Promise<void> => {
  try {
    if (!process.env['MONGODB_URI']) {
      console.warn('MongoDB URI not configured, skipping MongoDB connection')
      return
    }

    await mongoose.connect(process.env['MONGODB_URI'], {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false
    })

    mongoClient = mongoose
    console.log('MongoDB connected successfully')
  } catch (error) {
    console.error('Failed to connect to MongoDB', { error })
    throw error
  }
}

// ============================================================================
// CLIENT UTILITIES
// ============================================================================

export const getMongoClient = (): typeof mongoose => {
  if (!mongoClient) {
    throw new Error('MongoDB client not initialized. Call connectMongoDB() first.')
  }
  return mongoClient
}

export const closeMongoConnection = async (): Promise<void> => {
  try {
    if (mongoClient) {
      await mongoClient.disconnect()
      console.log('MongoDB connection closed')
    }
  } catch (error) {
    console.error('Failed to close MongoDB connection', { error })
    throw error
  }
}

export const checkMongoHealth = async (): Promise<boolean> => {
  try {
    if (!mongoClient) {
      return false
    }
    
    const adminDb = mongoClient.connection.db?.admin()
    if (!adminDb) {
      return false
    }
    
    await adminDb.ping()
    return true
  } catch (error) {
    console.error('MongoDB health check failed', { error })
    return false
  }
}

// ============================================================================
// CONNECTION EVENT HANDLERS
// ============================================================================

mongoose.connection.on('connected', () => {
  console.log('MongoDB connection established')
})

mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error', { error })
})

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB connection disconnected')
})

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

process.on('SIGINT', async () => {
  try {
    await closeMongoConnection()
    process.exit(0)
  } catch (error) {
    console.error('Error during MongoDB shutdown', { error })
    process.exit(1)
  }
})

process.on('SIGTERM', async () => {
  try {
    await closeMongoConnection()
    process.exit(0)
  } catch (error) {
    console.error('Error during MongoDB shutdown', { error })
    process.exit(1)
  }
})

// ============================================================================
// EXPORTS
// ============================================================================

export { mongoose }

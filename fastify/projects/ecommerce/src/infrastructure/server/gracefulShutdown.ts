/**
 * Graceful Shutdown Handler
 * 
 * Handles graceful shutdown for the Fastify server with proper cleanup.
 * Ensures all connections are closed and resources are released properly.
 */

import type { FastifyInstance } from 'fastify'

export const gracefulShutdown = (app: import('fastify').FastifyInstance) => {
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM']
  
  signals.forEach((signal) => {
    process.on(signal, async () => {
      console.log(`Received ${signal}, shutting down gracefully...`)
      
      try {
        await app.close()
        console.log('Server closed successfully')
        process.exit(0)
      } catch (error) {
        console.error('Error during shutdown:', error)
        process.exit(1)
      }
    })
  })

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error)
    process.exit(1)
  })

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason)
    process.exit(1)
  })
}

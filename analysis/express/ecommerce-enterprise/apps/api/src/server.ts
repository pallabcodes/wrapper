/**
 * Ecommerce Enterprise API Server
 * 
 * Server startup file with proper configuration and error handling.
 */

import app from './index'
import { logger } from '@ecommerce-enterprise/core'

const PORT = process.env['PORT'] || 3000

const server = app.listen(PORT, () => {
  logger.info(`🚀 Ecommerce Enterprise API Server running on port ${PORT}`)
  console.log(`🚀 Server ready at http://localhost:${PORT}`)
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`)
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`)
  console.log(`🔐 Auth Endpoints: http://localhost:${PORT}/api/v1/auth`)
})

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  server.close(() => {
    logger.info('Process terminated')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
  server.close(() => {
    logger.info('Process terminated')
    process.exit(0)
  })
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error)
  process.exit(1)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

export default server

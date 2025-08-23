/**
 * Main Application Entry Point
 * 
 * Functional ecommerce platform built with Fastify
 * Enterprise-grade architecture with instant microservice extraction
 */

import { start } from './app.js'

// Start the application
start().catch((error: Error) => {
  console.error('❌ Application failed to start:', error)
  process.exit(1)
})

/**
 * Routes Configuration
 * 
 * API route registration for enterprise ecommerce platform
 */

import type { FastifyInstance } from 'fastify'
import { registerAuthRoutes } from '../modules/auth/authRoutes-minimal.js'
import { productRoutes } from '../modules/product/productRoutes.js'

// ============================================================================
// ROUTES REGISTRATION
// ============================================================================

export const setupRoutes = async (fastify: FastifyInstance): Promise<void> => {
  // Health check endpoint
  fastify.get('/health', {
    schema: {
      description: 'Health check endpoint',
      tags: ['System'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'number' },
            environment: { type: 'string' },
            version: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    }
  })

  // Register auth routes using Fastify extensions
  registerAuthRoutes(fastify)

  // Register API routes under /api/v1 prefix
  await fastify.register(async function (fastify) {
    // Product routes (keeping old approach for now)
    await fastify.register(productRoutes, { prefix: '/products' })
    
    // Future modules can be registered here:
    // await fastify.register(userRoutes, { prefix: '/users' })
    // await fastify.register(orderRoutes, { prefix: '/orders' })
    // await fastify.register(paymentRoutes, { prefix: '/payments' })
  }, { prefix: '/api/v1' })
}

/**
 * Routes Configuration
 * 
 * API route registration for enterprise ecommerce platform
 */

import type { FastifyInstance } from 'fastify'
import { registerAuthRoutes } from '../modules/auth/authRoutes-minimal.js'
import { productRoutes } from '../modules/product/productRoutes-simple.js'

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

  // Register auth routes
  await fastify.register(async function (fastify) {
    // Simple auth routes without complex schemas for now
    fastify.post('/register', {
      schema: {
        description: 'Register a new user',
        tags: ['Authentication'],
        body: {
          type: 'object',
          required: ['email', 'password', 'acceptTerms'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            confirmPassword: { type: 'string' },
            acceptTerms: { type: 'boolean' }
          }
        }
      },
      handler: async (request, reply) => {
        return reply.send({ success: true, message: 'Registration endpoint' })
      }
    })

    fastify.post('/login', {
      schema: {
        description: 'User login',
        tags: ['Authentication'],
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' }
          }
        }
      },
      handler: async (request, reply) => {
        return reply.send({ success: true, message: 'Login endpoint' })
      }
    })
  }, { prefix: '/api/v1/auth' })

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

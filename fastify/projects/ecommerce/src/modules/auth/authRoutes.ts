/**
 * Authentication Routes
 * 
 * Fastify routes for authentication endpoints
 * Demonstrates complete API integration with controllers
 */

import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { AuthController } from './authController.js'
import { RegisterRequestSchema, LoginRequestSchema } from './controller-schemas.js'

// ============================================================================
// AUTHENTICATION ROUTES PLUGIN
// ============================================================================

export async function authRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  // Create controller instances for each request
  const createAuthController = (reply: import('fastify').FastifyReply) => new AuthController(reply)

  // Register route
  fastify.post('/register', {
    schema: {
      description: 'Register a new user',
      tags: ['Authentication'],
      body: RegisterRequestSchema
    },
    handler: (request, reply) => createAuthController(reply).register(request, reply)
  })

  // Login route
  fastify.post('/login', {
    schema: {
      description: 'Authenticate user login',
      tags: ['Authentication'],
      body: LoginRequestSchema
    },
    handler: (request, reply) => createAuthController(reply).login(request, reply)
  })

  // Logout route
  fastify.post('/logout', {
    schema: {
      description: 'Logout user and invalidate tokens',
      tags: ['Authentication'],
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string', pattern: '^Bearer .+' }
        },
        required: ['authorization']
      }
    },
    handler: (request, reply) => createAuthController(reply).logout(request, reply)
  })

  // Profile route
  fastify.get('/profile', {
    schema: {
      description: 'Get current user profile',
      tags: ['Authentication'],
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string', pattern: '^Bearer .+' }
        },
        required: ['authorization']
      }
    },
    handler: (request, reply) => createAuthController(reply).getProfile(request, reply)
  })
}

// ============================================================================
// ROUTE PLUGIN METADATA
// ============================================================================

// Plugin metadata for Fastify
Object.defineProperty(authRoutes, Symbol.for('plugin-meta'), {
  value: {
    name: 'auth-routes',
    version: '1.0.0'
  },
  writable: false,
  enumerable: false,
  configurable: false
})

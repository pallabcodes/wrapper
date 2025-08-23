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
  const authController = new AuthController()

  // Register route
  fastify.post('/register', {
    schema: {
      description: 'Register a new user',
      tags: ['Authentication'],
      body: RegisterRequestSchema,
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string', format: 'email' },
                roles: { type: 'array', items: { type: 'string' } },
                status: { type: 'string' },
                emailVerified: { type: 'boolean' }
              }
            },
            meta: {
              type: 'object',
              properties: {
                timestamp: { type: 'string', format: 'date-time' },
                requestId: { type: 'string' },
                version: { type: 'string' },
                emailVerificationRequired: { type: 'boolean' }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean', enum: [false] },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                details: { type: 'object' }
              }
            }
          }
        }
      }
    },
    handler: authController.register.bind(authController)
  })

  // Login route
  fastify.post('/login', {
    schema: {
      description: 'Authenticate user login',
      tags: ['Authentication'],
      body: LoginRequestSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    roles: { type: 'array', items: { type: 'string' } },
                    status: { type: 'string' },
                    emailVerified: { type: 'boolean' }
                  }
                },
                tokens: {
                  type: 'object',
                  properties: {
                    accessToken: { type: 'string' },
                    refreshToken: { type: 'string' },
                    expiresIn: { type: 'number' },
                    tokenType: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean', enum: [false] },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        }
      }
    },
    handler: authController.login.bind(authController)
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
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                message: { type: 'string' }
              }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      return reply.status(501).send({ message: 'Logout endpoint not implemented yet' })
    }
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
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string', format: 'email' },
                roles: { type: 'array', items: { type: 'string' } },
                status: { type: 'string' },
                emailVerified: { type: 'boolean' },
                profile: {
                  type: 'object',
                  properties: {
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    displayName: { type: 'string' }
                  }
                },
                lastLoginAt: { type: 'string', format: 'date-time' },
                createdAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      }
    },
    handler: async (request, reply) => {
      return reply.status(501).send({ message: 'Get profile endpoint not implemented yet' })
    }
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

/**
 * Minimal Auth Routes
 * 
 * Uses simple Fastify extensions that wrap native APIs
 * with better DX but fall back to native if anything breaks.
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { extendFastify } from '../../shared/fastify-simple.js'
import { AuthService } from './authService.js'
import { ResponseBuilder } from '../../shared/response/index.js'
import { RegisterRequestSchema, LoginRequestSchema } from './controller-schemas.js'

// ============================================================================
// SCHEMAS
// ============================================================================

const RegisterSchema = {
  body: {
    type: 'object',
    required: ['email', 'password', 'confirmPassword', 'acceptTerms'],
    properties: {
      email: { type: 'string', format: 'email', maxLength: 255 },
      password: { type: 'string', minLength: 8, maxLength: 128 },
      confirmPassword: { type: 'string' },
      firstName: { type: 'string', minLength: 1, maxLength: 50 },
      lastName: { type: 'string', minLength: 1, maxLength: 50 },
      acceptTerms: { type: 'boolean' },
      marketingConsent: { type: 'boolean', default: false }
    }
  },
  response: {
    201: {
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
                email: { type: 'string' },
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
        },
        timestamp: { type: 'string' },
        message: { type: 'string' }
      }
    },
    400: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        error: { type: 'string' },
        timestamp: { type: 'string' }
      }
    }
  }
}

const LoginSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 1 },
      rememberMe: { type: 'boolean', default: false }
    }
  },
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
                email: { type: 'string' },
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
        },
        timestamp: { type: 'string' },
        message: { type: 'string' }
      }
    },
    401: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        error: { type: 'string' },
        timestamp: { type: 'string' }
      }
    }
  }
}

// ============================================================================
// HANDLERS
// ============================================================================

const registerHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const authService = request.server.di.get<AuthService>('authService')
  const { email, password, firstName, lastName, marketingConsent } = request.body as any
  const ipAddress = authService.extractClientIP(request)

  try {
    const result = await authService.registerUser(
      email,
      password,
      firstName,
      lastName,
      marketingConsent,
      ipAddress
    )

    return reply.status(201).send(
      new ResponseBuilder().success(result).build()
    )
  } catch (error) {
    return reply.status(400).send(
      new ResponseBuilder().error('REGISTRATION_FAILED', error instanceof Error ? error.message : 'Registration failed').build()
    )
  }
}

const loginHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const authService = request.server.di.get<AuthService>('authService')
  const { email, password, rememberMe } = request.body as any
  const ipAddress = authService.extractClientIP(request)
  const userAgent = request.headers['user-agent']

  try {
    const result = await authService.loginUser(
      email,
      password,
      rememberMe,
      ipAddress,
      userAgent
    )

    return reply.status(200).send(
      new ResponseBuilder().success(result).build()
    )
  } catch (error) {
    return reply.status(401).send(
      new ResponseBuilder().error('INVALID_CREDENTIALS', error instanceof Error ? error.message : 'Invalid credentials').build()
    )
  }
}

const logoutHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  return reply.status(501).send(
    new ResponseBuilder().error('NOT_IMPLEMENTED', 'Logout endpoint not implemented yet').build()
  )
}

const getProfileHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  return reply.status(501).send(
    new ResponseBuilder().error('NOT_IMPLEMENTED', 'Get profile endpoint not implemented yet').build()
  )
}

// ============================================================================
// ROUTE REGISTRATION
// ============================================================================

export const registerAuthRoutes = (fastify: FastifyInstance): void => {
  // Extend Fastify with our simple enhancements
  extendFastify(fastify)

  // Register services
  fastify.di.register('authService', new AuthService())

  // Register routes using native Fastify for Swagger compatibility
  fastify.post('/api/v1/auth/register', {
    schema: {
      ...RegisterSchema,
      tags: ['Authentication'],
      summary: 'Register a new user',
      description: 'Create a new user account with email and password'
    },
    handler: registerHandler
  })

  fastify.post('/api/v1/auth/login', {
    schema: {
      ...LoginSchema,
      tags: ['Authentication'],
      summary: 'User login',
      description: 'Authenticate user with email and password'
    },
    handler: loginHandler
  })

  fastify.post('/api/v1/auth/logout', {
    schema: {
      tags: ['Authentication'],
      summary: 'User logout',
      description: 'Logout the current user',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: logoutHandler
  })

  fastify.get('/api/v1/auth/profile', {
    schema: {
      tags: ['Authentication'],
      summary: 'Get user profile',
      description: 'Retrieve the current user profile',
      security: [{ bearerAuth: [] }],
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
                    email: { type: 'string' },
                    roles: { type: 'array', items: { type: 'string' } },
                    status: { type: 'string' }
                  }
                }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    },
    handler: getProfileHandler
  })
}

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
  body: RegisterRequestSchema,
  response: {
    201: z.object({
      success: z.boolean(),
      data: z.object({
        user: z.object({
          id: z.string(),
          email: z.string(),
          roles: z.array(z.string()),
          status: z.string(),
          emailVerified: z.boolean()
        }),
        tokens: z.object({
          accessToken: z.string(),
          refreshToken: z.string(),
          expiresIn: z.number(),
          tokenType: z.string()
        })
      }),
      timestamp: z.string(),
      message: z.string()
    }),
    400: z.object({
      success: z.boolean(),
      error: z.string(),
      timestamp: z.string()
    })
  }
}

const LoginSchema = {
  body: LoginRequestSchema,
  response: {
    200: z.object({
      success: z.boolean(),
      data: z.object({
        user: z.object({
          id: z.string(),
          email: z.string(),
          roles: z.array(z.string()),
          status: z.string(),
          emailVerified: z.boolean()
        }),
        tokens: z.object({
          accessToken: z.string(),
          refreshToken: z.string(),
          expiresIn: z.number(),
          tokenType: z.string()
        })
      }),
      timestamp: z.string(),
      message: z.string()
    }),
    401: z.object({
      success: z.boolean(),
      error: z.string(),
      timestamp: z.string()
    })
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

  // Register routes using the enhanced route builder
  fastify.routeBuilder
    .post('/api/v1/auth/register')
    .schema(RegisterSchema)
    .handler(registerHandler)
    .register()

  fastify.routeBuilder
    .post('/api/v1/auth/login')
    .schema(LoginSchema)
    .handler(loginHandler)
    .register()

  fastify.routeBuilder
    .post('/api/v1/auth/logout')
    .handler(logoutHandler)
    .register()

  fastify.routeBuilder
    .get('/api/v1/auth/profile')
    .handler(getProfileHandler)
    .register()

  // Alternative: Use native Fastify if route builder fails
  try {
    // This would be the fallback if route builder doesn't work
    fastify.post('/api/v1/auth/register-fallback', {
      schema: RegisterSchema,
      handler: registerHandler
    })
  } catch (error) {
    console.warn('Native route registration failed:', error)
  }
}

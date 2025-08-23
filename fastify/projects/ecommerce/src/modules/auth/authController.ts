/**
 * Enhanced Authentication Controllers
 * 
 * Enterprise-grade authentication with centralized response handling
 * Demonstrates complete architecture in action
 */

import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { BaseController } from '../../shared/response/index.js'
import { AuthService } from './authService.js'
import { RegisterRequestSchema, LoginRequestSchema, type AuthResponse } from './controller-schemas.js'

// ============================================================================
// AUTHENTICATION CONTROLLER
// ============================================================================

export class AuthController extends BaseController {
  private authService = new AuthService()
  
  /**
   * Register a new user
   * POST /api/auth/register
   */
  async register(
    request: FastifyRequest<{ Body: z.infer<typeof RegisterRequestSchema> }>,
    reply: FastifyReply
  ): Promise<void> {
    const requestId = this.extractRequestId(request)

    try {
      // Validate request body
      const validationResult = RegisterRequestSchema.safeParse(request.body)
      if (!validationResult.success) {
        return this.response
          .badRequest('Invalid registration data', {
            validation: validationResult.error.issues
          })
          .send(reply, requestId)
      }

      const { email, password, firstName, lastName, acceptTerms, marketingConsent } = validationResult.data

      // Execute registration using service
      const authResponse = await this.authService.registerUser(
        email,
        password,
        firstName,
        lastName,
        marketingConsent,
        this.authService.extractClientIP(request)
      )

      // Success response
      return this.response
        .created(authResponse)
        .withMeta('emailVerificationRequired', true)
        .send(reply, requestId)

    } catch (error) {
      const errorResponse = this.handleError(error as Error, requestId)
      return reply.status(500).send(errorResponse)
    }
  }

  /**
   * Authenticate user login
   * POST /api/auth/login
   */
  async login(
    request: FastifyRequest<{ Body: z.infer<typeof LoginRequestSchema> }>,
    reply: FastifyReply
  ): Promise<void> {
    const requestId = this.extractRequestId(request)

    try {
      // Validate request body
      const validationResult = LoginRequestSchema.safeParse(request.body)
      if (!validationResult.success) {
        return this.response
          .badRequest('Invalid login data', {
            validation: validationResult.error.issues
          })
          .send(reply, requestId)
      }

      const { email, password, rememberMe } = validationResult.data

      // Execute login using service
      const authResponse = await this.authService.loginUser(
        email,
        password,
        rememberMe,
        this.authService.extractClientIP(request),
        request.headers['user-agent']
      )

      // Success response with tokens
      return this.response
        .success(authResponse)
        .withMeta('loginTime', new Date())
        .withMeta('sessionDuration', rememberMe ? '30d' : '24h')
        .send(reply, requestId)

    } catch (error) {
      const errorResponse = this.handleError(error as Error, requestId)
      return reply.status(500).send(errorResponse)
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  // Helper methods moved to AuthService
}

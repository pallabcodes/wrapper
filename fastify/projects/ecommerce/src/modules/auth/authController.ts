/**
 * Enhanced Authentication Controllers
 * 
 * Enterprise-grade authentication with centralized response handling
 * Demonstrates complete architecture in action
 */

import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { ChainableResponseBuilder } from '../../shared/response/chainable-builder.js'
import { AuthService } from './authService.js'
import { RegisterRequestZodSchema, LoginRequestZodSchema, type AuthResponse } from './controller-schemas.js'

// ============================================================================
// AUTHENTICATION CONTROLLER
// ============================================================================

export class AuthController {
  private authService = new AuthService()
  private response: ChainableResponseBuilder

  constructor(reply: FastifyReply) {
    this.response = new ChainableResponseBuilder(reply)
  }

  /**
   * Extract request ID from request
   */
  private extractRequestId(request: FastifyRequest): string {
    return request.id || 'unknown'
  }

  /**
   * Handle errors consistently
   */
  private handleError(error: Error, requestId: string): {
    success: false;
    error: {
      code: string;
      message: string;
      requestId: string;
    };
    meta: {
      timestamp: Date;
      requestId: string;
      version: string;
    };
  } {
    console.error(`Error in request ${requestId}:`, error)
    
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Internal server error',
        requestId
      },
      meta: {
        timestamp: new Date(),
        requestId,
        version: process.env.npm_package_version || '1.0.0'
      }
    }
  }
  
  /**
   * Register a new user
   * POST /api/auth/register
   */
  async register(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const requestId = this.extractRequestId(request)

    try {
      // Validate request body
      // Validate input using Zod
      const validationResult = RegisterRequestZodSchema.safeParse(request.body)
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
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const requestId = this.extractRequestId(request)

    try {
      // Validate request body
      // Validate input
      const validationResult = LoginRequestZodSchema.safeParse(request.body)
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

  /**
   * Logout user
   * POST /api/auth/logout
   */
  async logout(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const requestId = this.extractRequestId(request)

    try {
      // Extract token from authorization header
      const authHeader = request.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return this.response
          .unauthorized('Invalid or missing authorization token')
          .send(reply, requestId)
      }

      const token = authHeader.substring(7) // Remove 'Bearer ' prefix

      // Execute logout using service
      await this.authService.logoutUser(token)

      // Success response
      return this.response
        .success({ message: 'Successfully logged out' })
        .withMeta('logoutTime', new Date())
        .send(reply, requestId)

    } catch (error) {
      const errorResponse = this.handleError(error as Error, requestId)
      return reply.status(500).send(errorResponse)
    }
  }

  /**
   * Get user profile
   * GET /api/auth/profile
   */
  async getProfile(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const requestId = this.extractRequestId(request)

    try {
      // Extract token from authorization header
      const authHeader = request.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return this.response
          .unauthorized('Invalid or missing authorization token')
          .send(reply, requestId)
      }

      const token = authHeader.substring(7) // Remove 'Bearer ' prefix

      // Execute profile retrieval using service
      const profile = await this.authService.getUserProfile(token)

      // Success response
      return this.response
        .success(profile)
        .withMeta('profileRetrievedAt', new Date())
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

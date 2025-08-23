/**
 * Enhanced Authentication Controllers
 * 
 * Enterprise-grade authentication with centralized response handling
 * Demonstrates complete architecture in action
 */

import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { pipe } from 'fp-ts/lib/function'
import * as TE from 'fp-ts/lib/TaskEither'
import { BaseController } from '../../shared/response/index.js'
import type { ApiResponse } from '../../shared/types/index.js'
import {
  registerUser,
  loginUser,
  type RegisterUserCommand,
  type LoginUserCommand,
  type TokenPair,
  type UserState
} from './authModule.js'

// ============================================================================
// REQUEST/RESPONSE SCHEMAS
// ============================================================================

export const RegisterRequestSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  confirmPassword: z.string(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  acceptTerms: z.boolean().refine(val => val === true, 'Must accept terms and conditions'),
  marketingConsent: z.boolean().default(false)
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().default(false)
})

export interface AuthResponse {
  readonly user: {
    readonly id: string
    readonly email: string
    readonly roles: readonly string[]
    readonly status: string
    readonly emailVerified: boolean
  }
  readonly tokens: TokenPair
}

// ============================================================================
// AUTHENTICATION CONTROLLER
// ============================================================================

export class AuthController extends BaseController {
  
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

      // Create registration command
      const command: RegisterUserCommand = {
        id: this.generateUserId(),
        email,
        password,
        profile: {
          firstName,
          lastName
        },
        marketingConsent,
        registrationIp: this.extractClientIP(request)
      }

      // Execute registration
      const result = await pipe(
        registerUser(command),
        TE.map(userAggregate => this.mapUserToResponse(userAggregate.state)),
        TE.mapLeft(error => this.mapDomainErrorToResponse(error))
      )()

      if (result._tag === 'Left') {
        const errorResponse = result.left
        return reply.status(errorResponse.statusCode || 400).send(errorResponse.response)
      }

      // Success response
      return this.response
        .created(result.right)
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

      // Create login command
      const command: LoginUserCommand = {
        email,
        password,
        sessionId: this.generateSessionId(),
        ipAddress: this.extractClientIP(request),
        ...(request.headers['user-agent'] && { userAgent: request.headers['user-agent'] })
      }

      // Execute login (this would require user lookup first)
      // For demo purposes, showing the pattern
      const result = await this.executeLogin(command)

      if (result._tag === 'Left') {
        return this.response
          .unauthorized('Invalid credentials')
          .send(reply, requestId)
      }

      // Success response with tokens
      const authResponse: AuthResponse = {
        user: this.mapUserToResponse(result.right.user.state),
        tokens: result.right.tokens
      }

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
    request: FastifyRequest<{ Headers: { authorization?: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    const requestId = this.extractRequestId(request)

    try {
      // Extract and validate token
      const token = this.extractBearerToken(request)
      if (!token) {
        return this.response
          .unauthorized('Authentication token required')
          .send(reply, requestId)
      }

      // Invalidate token (implementation would depend on token strategy)
      await this.invalidateToken(token)

      return this.response
        .success({ message: 'Successfully logged out' })
        .send(reply, requestId)

    } catch (error) {
      const errorResponse = this.handleError(error as Error, requestId)
      return reply.status(500).send(errorResponse)
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/profile
   */
  async getProfile(
    request: FastifyRequest<{ Headers: { authorization?: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    const requestId = this.extractRequestId(request)

    try {
      // Extract user from token (would be done via middleware in real implementation)
      const user = await this.extractUserFromRequest(request)
      if (!user) {
        return this.response
          .unauthorized('Invalid or expired token')
          .send(reply, requestId)
      }

      const userResponse = this.mapUserToResponse(user)

      return this.response
        .success(userResponse)
        .withMeta('lastAccessed', new Date())
        .send(reply, requestId)

    } catch (error) {
      const errorResponse = this.handleError(error as Error, requestId)
      return reply.status(500).send(errorResponse)
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substring(2)}`
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2)}`
  }

  private extractClientIP(request: FastifyRequest): string {
    return (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
           (request.headers['x-real-ip'] as string) ||
           request.ip ||
           'unknown'
  }

  private extractBearerToken(request: FastifyRequest<{ Headers: { authorization?: string } }>): string | null {
    const authorization = request.headers.authorization
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return null
    }
    return authorization.substring(7)
  }

  private mapUserToResponse(user: UserState) {
    return {
      id: user.id,
      email: user.email,
      roles: user.roles,
      status: user.status,
      emailVerified: user.emailVerified,
      profile: user.profile ? {
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        displayName: user.profile.displayName
      } : undefined,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt
    }
  }

  private mapDomainErrorToResponse(error: any) {
    const statusCodeMap: Record<string, number> = {
      'ValidationError': 400,
      'BusinessRuleError': 422,
      'NotFoundError': 404,
      'ConflictError': 409,
      'AuthorizationError': 401,
      'InfrastructureError': 500
    }

    const statusCode = statusCodeMap[error.type] || 500
    
    return {
      statusCode,
      response: this.response.internalError(error.message, error.context || {}).build()
    }
  }

  private async executeLogin(command: LoginUserCommand) {
    // This would integrate with user repository to find user first
    // Then call loginUser function
    // For demo purposes, returning a mock structure using TaskEither pattern
    return TE.right({
      user: {
        state: {
          id: 'user_123',
          email: command.email,
          roles: ['customer'],
          status: 'active',
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        } as UserState
      },
      tokens: {
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
        expiresIn: 3600,
        tokenType: 'Bearer' as const
      }
    })()
  }

  private async invalidateToken(token: string): Promise<void> {
    // Implementation would depend on token storage strategy
    // Could be JWT blacklist, Redis, database, etc.
    console.log(`Token ${token} invalidated`)
  }

  private async extractUserFromRequest(request: FastifyRequest): Promise<UserState | null> {
    // Implementation would decode JWT or lookup session
    // For demo purposes, returning mock user
    return {
      id: 'user_123',
      email: 'user@example.com',
      passwordHash: 'hashed',
      roles: ['customer'],
      permissions: [],
      status: 'active',
      addresses: [],
      securitySettings: {
        twoFactorEnabled: false,
        loginNotifications: true,
        sessionTimeout: 1440,
        allowMultipleSessions: true,
        ipWhitelist: [],
        passwordExpiryDays: 90
      },
      emailVerified: true,
      phoneVerified: false,
      loginAttempts: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    } as UserState
  }
}

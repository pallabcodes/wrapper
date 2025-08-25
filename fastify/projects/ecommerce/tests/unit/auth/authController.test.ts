/**
 * Authentication Controller Tests
 * 
 * Unit tests for authentication endpoints
 * Demonstrates testing patterns for enterprise applications
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import Fastify from 'fastify'
import type { FastifyInstance } from 'fastify'
import { authRoutes } from '../../../src/modules/auth/authRoutes.js'

// ============================================================================
// TEST SETUP
// ============================================================================

describe('Authentication Controller', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    // Initialize Fastify instance for testing
    app = Fastify({
      logger: false // Disable logging during tests
    })

    // Register auth routes
    await app.register(authRoutes, { prefix: '/auth' })
    
    // Ready the application
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    // Reset any mocks or test data
  })

  // ==========================================================================
  // REGISTRATION TESTS
  // ==========================================================================

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        confirmPassword: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe'
      }

      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: registerData
      })

      expect(response.statusCode).toBe(201)
      
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data).toHaveProperty('id')
      expect(body.data).toHaveProperty('email', registerData.email)
      expect(body.data).toHaveProperty('roles')
      expect(body.data).toHaveProperty('status', 'pending')
      expect(body.data).toHaveProperty('emailVerified', false)
      expect(body.meta).toHaveProperty('timestamp')
      expect(body.meta).toHaveProperty('requestId')
      expect(body.meta).toHaveProperty('emailVerificationRequired', true)
    })

    it('should reject registration with invalid email', async () => {
      const registerData = {
        email: 'invalid-email',
        password: 'SecurePassword123!',
        confirmPassword: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe'
      }

      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: registerData
      })

      expect(response.statusCode).toBe(400)
      
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
      expect(body.error).toHaveProperty('code', 'VALIDATION_ERROR')
      expect(body.error).toHaveProperty('message')
      expect(body.error.details).toHaveProperty('email')
    })

    it('should reject registration with weak password', async () => {
      const registerData = {
        email: 'test@example.com',
        password: '123',
        confirmPassword: '123',
        firstName: 'John',
        lastName: 'Doe'
      }

      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: registerData
      })

      expect(response.statusCode).toBe(400)
      
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
      expect(body.error).toHaveProperty('code', 'VALIDATION_ERROR')
      expect(body.error.details).toHaveProperty('password')
    })

    it('should reject registration when passwords do not match', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        confirmPassword: 'DifferentPassword123!',
        firstName: 'John',
        lastName: 'Doe'
      }

      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: registerData
      })

      expect(response.statusCode).toBe(400)
      
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
      expect(body.error).toHaveProperty('code', 'VALIDATION_ERROR')
    })
  })

  // ==========================================================================
  // LOGIN TESTS
  // ==========================================================================

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'SecurePassword123!'
      }

      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: loginData
      })

      expect(response.statusCode).toBe(200)
      
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data).toHaveProperty('user')
      expect(body.data).toHaveProperty('tokens')
      expect(body.data.user).toHaveProperty('id')
      expect(body.data.user).toHaveProperty('email', loginData.email)
      expect(body.data.tokens).toHaveProperty('accessToken')
      expect(body.data.tokens).toHaveProperty('refreshToken')
      expect(body.data.tokens).toHaveProperty('expiresIn')
      expect(body.data.tokens).toHaveProperty('tokenType', 'Bearer')
    })

    it('should reject login with invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword123!'
      }

      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: loginData
      })

      expect(response.statusCode).toBe(401)
      
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
      expect(body.error).toHaveProperty('code', 'INVALID_CREDENTIALS')
      expect(body.error).toHaveProperty('message', 'Invalid email or password')
    })

    it('should reject login with missing fields', async () => {
      const loginData = {
        email: 'test@example.com'
        // Missing password
      }

      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: loginData
      })

      expect(response.statusCode).toBe(400)
      
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
      expect(body.error).toHaveProperty('code', 'VALIDATION_ERROR')
    })
  })

  // ==========================================================================
  // LOGOUT TESTS
  // ==========================================================================

  describe('POST /auth/logout', () => {
    it('should logout successfully with valid token', async () => {
      // First login to get a token
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'SecurePassword123!'
        }
      })
      
      const loginBody = JSON.parse(loginResponse.body)
      const accessToken = loginBody.data.tokens.accessToken

      // Then logout
      const response = await app.inject({
        method: 'POST',
        url: '/auth/logout',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data).toHaveProperty('message', 'Logged out successfully')
    })

    it('should reject logout without authorization header', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/logout'
      })

      expect(response.statusCode).toBe(400)
    })

    it('should reject logout with invalid token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/logout',
        headers: {
          authorization: 'Bearer invalid-token'
        }
      })

      expect(response.statusCode).toBe(401)
    })
  })

  // ==========================================================================
  // PROFILE TESTS
  // ==========================================================================

  describe('GET /auth/profile', () => {
    it('should get user profile with valid token', async () => {
      // First login to get a token
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'SecurePassword123!'
        }
      })
      
      const loginBody = JSON.parse(loginResponse.body)
      const accessToken = loginBody.data.tokens.accessToken

      // Then get profile
      const response = await app.inject({
        method: 'GET',
        url: '/auth/profile',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data).toHaveProperty('id')
      expect(body.data).toHaveProperty('email')
      expect(body.data).toHaveProperty('roles')
      expect(body.data).toHaveProperty('profile')
      expect(body.data).toHaveProperty('lastLoginAt')
      expect(body.data).toHaveProperty('createdAt')
    })

    it('should reject profile access without authorization', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/profile'
      })

      expect(response.statusCode).toBe(400)
    })
  })
})

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Authentication Flow Integration', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = Fastify({ logger: false })
    await app.register(authRoutes, { prefix: '/auth' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should complete full authentication flow', async () => {
    // 1. Register a user
    const registerResponse = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'integration@example.com',
        password: 'SecurePassword123!',
        confirmPassword: 'SecurePassword123!',
        firstName: 'Integration',
        lastName: 'Test'
      }
    })

    expect(registerResponse.statusCode).toBe(201)

    // 2. Login with the user
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'integration@example.com',
        password: 'SecurePassword123!'
      }
    })

    expect(loginResponse.statusCode).toBe(200)
    const loginBody = JSON.parse(loginResponse.body)
    const accessToken = loginBody.data.tokens.accessToken

    // 3. Access profile
    const profileResponse = await app.inject({
      method: 'GET',
      url: '/auth/profile',
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    })

    expect(profileResponse.statusCode).toBe(200)

    // 4. Logout
    const logoutResponse = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    })

    expect(logoutResponse.statusCode).toBe(200)

    // 5. Try to access profile after logout (should fail)
    const profileAfterLogoutResponse = await app.inject({
      method: 'GET',
      url: '/auth/profile',
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    })

    expect(profileAfterLogoutResponse.statusCode).toBe(401)
  })
})

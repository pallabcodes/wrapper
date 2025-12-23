import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals'
import request from 'supertest'
import express from 'express'
import { authRouter } from '../../auth/authRoutes'
import { logger } from '@ecommerce-enterprise/core'

// Create test app
const app = express()
app.use(express.json())
app.use('/auth', authRouter)

describe('Auth API Integration Tests', () => {
  let authToken: string
  let refreshToken: string

  beforeAll(async () => {
    // Setup test environment
    logger.info('Setting up auth integration tests')
  })

  afterAll(async () => {
    // Cleanup test environment
    logger.info('Cleaning up auth integration tests')
  })

  beforeEach(async () => {
    // Reset test state
    authToken = ''
    refreshToken = ''
  })

  afterEach(async () => {
    // Clean up after each test
  })

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        firstName: 'John',
        lastName: 'Doe'
      }

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: expect.any(String),
        data: {
          user: {
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            isEmailVerified: false
          },
          tokens: {
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
            expiresIn: expect.any(Number)
          }
        },
        timestamp: expect.any(String),
        meta: {
          version: expect.any(String),
          environment: expect.any(String)
        }
      })

      // Store tokens for other tests
      authToken = response.body.data.tokens.accessToken
      refreshToken = response.body.data.tokens.refreshToken
    })

    it('should handle duplicate email registration', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'StrongPass123!',
        firstName: 'John',
        lastName: 'Doe'
      }

      // Register first time
      await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(200)

      // Try to register again with same email
      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(409)

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('already exists'),
        errorCode: 'CONFLICT',
        timestamp: expect.any(String),
        meta: {
          version: expect.any(String),
          environment: expect.any(String)
        }
      })
    })

    it('should validate required fields', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'weak'
      }

      const response = await request(app)
        .post('/auth/register')
        .send(invalidData)
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed',
        errorCode: 'VALIDATION_ERROR',
        details: expect.any(Object),
        timestamp: expect.any(String),
        meta: {
          version: expect.any(String),
          environment: expect.any(String)
        }
      })
    })

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({})
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed',
        errorCode: 'VALIDATION_ERROR',
        details: expect.any(Object),
        timestamp: expect.any(String)
      })
    })
  })

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      const userData = {
        email: 'login@example.com',
        password: 'StrongPass123!',
        firstName: 'Login',
        lastName: 'User'
      }
      await request(app)
        .post('/auth/register')
        .send(userData)
    })

    it('should login user successfully', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'StrongPass123!'
      }

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: expect.any(String),
        data: {
          user: {
            email: loginData.email,
            firstName: 'Login',
            lastName: 'User'
          },
          tokens: {
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
            expiresIn: expect.any(Number)
          }
        },
        timestamp: expect.any(String),
        meta: {
          version: expect.any(String),
          environment: expect.any(String)
        }
      })

      authToken = response.body.data.tokens.accessToken
      refreshToken = response.body.data.tokens.refreshToken
    })

    it('should handle invalid credentials', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'WrongPassword123!'
      }

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Invalid credentials'),
        errorCode: 'UNAUTHORIZED',
        timestamp: expect.any(String),
        meta: {
          version: expect.any(String),
          environment: expect.any(String)
        }
      })
    })

    it('should handle non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'StrongPass123!'
      }

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Invalid credentials'),
        errorCode: 'UNAUTHORIZED',
        timestamp: expect.any(String)
      })
    })

    it('should validate login data', async () => {
      const invalidData = {
        email: 'invalid-email'
      }

      const response = await request(app)
        .post('/auth/login')
        .send(invalidData)
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed',
        errorCode: 'VALIDATION_ERROR',
        details: expect.any(Object),
        timestamp: expect.any(String)
      })
    })
  })

  describe('POST /auth/refresh-token', () => {
    beforeEach(async () => {
      // Create a test user and get tokens
      const userData = {
        email: 'refresh@example.com',
        password: 'StrongPass123!',
        firstName: 'Refresh',
        lastName: 'User'
      }
      const registerResponse = await request(app)
        .post('/auth/register')
        .send(userData)
      
      refreshToken = registerResponse.body.data.tokens.refreshToken
    })

    it('should refresh token successfully', async () => {
      const response = await request(app)
        .post('/auth/refresh-token')
        .send({ refreshToken })
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: expect.any(String),
        data: {
          tokens: {
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
            expiresIn: expect.any(Number)
          }
        },
        timestamp: expect.any(String),
        meta: {
          version: expect.any(String),
          environment: expect.any(String)
        }
      })

      // Verify new tokens are different
      expect(response.body.data.tokens.accessToken).not.toBe(authToken)
      expect(response.body.data.tokens.refreshToken).not.toBe(refreshToken)
    })

    it('should handle invalid refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh-token')
        .send({ refreshToken: 'invalid-token' })
        .expect(401)

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Invalid refresh token'),
        errorCode: 'UNAUTHORIZED',
        timestamp: expect.any(String)
      })
    })

    it('should validate refresh token data', async () => {
      const response = await request(app)
        .post('/auth/refresh-token')
        .send({})
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed',
        errorCode: 'VALIDATION_ERROR',
        details: expect.any(Object),
        timestamp: expect.any(String)
      })
    })
  })

  describe('GET /auth/me', () => {
    beforeEach(async () => {
      // Create a test user and get auth token
      const userData = {
        email: 'profile@example.com',
        password: 'StrongPass123!',
        firstName: 'Profile',
        lastName: 'User'
      }
      const registerResponse = await request(app)
        .post('/auth/register')
        .send(userData)
      
      authToken = registerResponse.body.data.tokens.accessToken
    })

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: expect.any(String),
        data: {
          user: {
            email: 'profile@example.com',
            firstName: 'Profile',
            lastName: 'User',
            isEmailVerified: false
          }
        },
        timestamp: expect.any(String),
        meta: {
          version: expect.any(String),
          environment: expect.any(String)
        }
      })
    })

    it('should handle missing authorization header', async () => {
      const response = await request(app)
        .get('/auth/me')
        .expect(401)

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('No token provided'),
        errorCode: 'UNAUTHORIZED',
        timestamp: expect.any(String)
      })
    })

    it('should handle invalid authorization header format', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', 'InvalidFormat token')
        .expect(401)

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Invalid token format'),
        errorCode: 'UNAUTHORIZED',
        timestamp: expect.any(String)
      })
    })

    it('should handle invalid token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403)

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Invalid token'),
        errorCode: 'FORBIDDEN',
        timestamp: expect.any(String)
      })
    })
  })

  describe('PUT /auth/profile', () => {
    beforeEach(async () => {
      // Create a test user and get auth token
      const userData = {
        email: 'update@example.com',
        password: 'StrongPass123!',
        firstName: 'Update',
        lastName: 'User'
      }
      const registerResponse = await request(app)
        .post('/auth/register')
        .send(userData)
      
      authToken = registerResponse.body.data.tokens.accessToken
    })

    it('should update user profile successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name'
      }

      const response = await request(app)
        .put('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: expect.any(String),
        data: {
          user: {
            email: 'update@example.com',
            firstName: 'Updated',
            lastName: 'Name'
          }
        },
        timestamp: expect.any(String),
        meta: {
          version: expect.any(String),
          environment: expect.any(String)
        }
      })
    })

    it('should validate profile update data', async () => {
      const invalidData = {
        firstName: '', // Empty string should be invalid
        email: 'invalid-email'
      }

      const response = await request(app)
        .put('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed',
        errorCode: 'VALIDATION_ERROR',
        details: expect.any(Object),
        timestamp: expect.any(String)
      })
    })

    it('should require authentication', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name'
      }

      const response = await request(app)
        .put('/auth/profile')
        .send(updateData)
        .expect(401)

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('No token provided'),
        errorCode: 'UNAUTHORIZED',
        timestamp: expect.any(String)
      })
    })
  })

  describe('POST /auth/change-password', () => {
    beforeEach(async () => {
      // Create a test user and get auth token
      const userData = {
        email: 'password@example.com',
        password: 'StrongPass123!',
        firstName: 'Password',
        lastName: 'User'
      }
      const registerResponse = await request(app)
        .post('/auth/register')
        .send(userData)
      
      authToken = registerResponse.body.data.tokens.accessToken
    })

    it('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'StrongPass123!',
        newPassword: 'NewStrongPass456!'
      }

      const response = await request(app)
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('Password changed successfully'),
        timestamp: expect.any(String),
        meta: {
          version: expect.any(String),
          environment: expect.any(String)
        }
      })
    })

    it('should handle incorrect current password', async () => {
      const passwordData = {
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewStrongPass456!'
      }

      const response = await request(app)
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Current password is incorrect'),
        errorCode: 'VALIDATION_ERROR',
        timestamp: expect.any(String)
      })
    })

    it('should validate password change data', async () => {
      const invalidData = {
        currentPassword: 'weak',
        newPassword: 'also-weak'
      }

      const response = await request(app)
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed',
        errorCode: 'VALIDATION_ERROR',
        details: expect.any(Object),
        timestamp: expect.any(String)
      })
    })

    it('should require authentication', async () => {
      const passwordData = {
        currentPassword: 'StrongPass123!',
        newPassword: 'NewStrongPass456!'
      }

      const response = await request(app)
        .post('/auth/change-password')
        .send(passwordData)
        .expect(401)

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('No token provided'),
        errorCode: 'UNAUTHORIZED',
        timestamp: expect.any(String)
      })
    })
  })

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .send({ refreshToken: 'some-token' })
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('Logged out successfully'),
        timestamp: expect.any(String),
        meta: {
          version: expect.any(String),
          environment: expect.any(String)
        }
      })
    })

    it('should validate logout data', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .send({})
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed',
        errorCode: 'VALIDATION_ERROR',
        details: expect.any(Object),
        timestamp: expect.any(String)
      })
    })
  })

  describe('POST /auth/forgot-password', () => {
    it('should handle forgot password request', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'test@example.com' })
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('If an account exists'),
        timestamp: expect.any(String),
        meta: {
          version: expect.any(String),
          environment: expect.any(String)
        }
      })
    })

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed',
        errorCode: 'VALIDATION_ERROR',
        details: expect.any(Object),
        timestamp: expect.any(String)
      })
    })
  })
})

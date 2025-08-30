import request from 'supertest'
import { Express } from 'express'
import { createApp } from '../../../apps/api/src/server'
import { clearAuthStorage } from '../../../modules/auth/authService'
import { clearProductStorage } from '../../../modules/product/productService'

describe('Auth Integration Tests', () => {
  let app: Express

  beforeAll(async () => {
    app = await createApp()
  })

  beforeEach(() => {
    clearAuthStorage()
    clearProductStorage()
  })

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        firstName: 'John',
        lastName: 'Doe'
      }

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201)

      expect(response.body).toMatchObject({
        success: true,
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
        }
      })

      expect(response.body.data.user).not.toHaveProperty('password')
    })

    it('should return 409 if user already exists', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        firstName: 'John',
        lastName: 'Doe'
      }

      // Register first user
      await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201)

      // Try to register same user again
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(409)

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: 'User already exists',
          code: 'CONFLICT'
        }
      })
    })

    it('should return 400 for weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe'
      }

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: 'Password must be at least 8 characters with uppercase, lowercase, and number',
          code: 'VALIDATION_ERROR'
        }
      })
    })

    it('should return 400 for invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'StrongPass123!',
        firstName: 'John',
        lastName: 'Doe'
      }

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for missing required fields', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'StrongPass123!'
        // Missing firstName and lastName
      }

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Register a user for login tests
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'StrongPass123!',
          firstName: 'John',
          lastName: 'Doe'
        })
    })

    it('should login user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'StrongPass123!'
      }

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            email: loginData.email,
            firstName: 'John',
            lastName: 'Doe'
          },
          tokens: {
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
            expiresIn: expect.any(Number)
          }
        }
      })
    })

    it('should return 401 for wrong password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword123!'
      }

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: 'Invalid credentials',
          code: 'UNAUTHORIZED'
        }
      })
    })

    it('should return 401 for non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'StrongPass123!'
      }

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: 'Invalid credentials',
          code: 'UNAUTHORIZED'
        }
      })
    })

    it('should return 400 for empty credentials', async () => {
      const loginData = {
        email: '',
        password: ''
      }

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: 'Email and password are required',
          code: 'VALIDATION_ERROR'
        }
      })
    })
  })

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken: string

    beforeEach(async () => {
      // Register and login to get refresh token
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'StrongPass123!',
          firstName: 'John',
          lastName: 'Doe'
        })

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'StrongPass123!'
        })

      refreshToken = loginResponse.body.data.tokens.refreshToken
    })

    it('should refresh token successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          tokens: {
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
            expiresIn: expect.any(Number)
          }
        }
      })

      // New refresh token should be different
      expect(response.body.data.tokens.refreshToken).not.toBe(refreshToken)
    })

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401)

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: 'Invalid refresh token',
          code: 'UNAUTHORIZED'
        }
      })
    })
  })

  describe('POST /api/v1/auth/logout', () => {
    let accessToken: string

    beforeEach(async () => {
      // Register and login to get access token
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'StrongPass123!',
          firstName: 'John',
          lastName: 'Doe'
        })

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'StrongPass123!'
        })

      accessToken = loginResponse.body.data.tokens.accessToken
    })

    it('should logout user successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'Logged out successfully'
      })
    })

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'UNAUTHORIZED'
        }
      })
    })
  })

  describe('GET /api/v1/auth/me', () => {
    let accessToken: string

    beforeEach(async () => {
      // Register and login to get access token
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'StrongPass123!',
          firstName: 'John',
          lastName: 'Doe'
        })

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'StrongPass123!'
        })

      accessToken = loginResponse.body.data.tokens.accessToken
    })

    it('should get current user profile', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            isEmailVerified: false
          }
        }
      })

      expect(response.body.data.user).not.toHaveProperty('password')
    })

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'UNAUTHORIZED'
        }
      })
    })
  })

  describe('PUT /api/v1/auth/profile', () => {
    let accessToken: string

    beforeEach(async () => {
      // Register and login to get access token
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'StrongPass123!',
          firstName: 'John',
          lastName: 'Doe'
        })

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'StrongPass123!'
        })

      accessToken = loginResponse.body.data.tokens.accessToken
    })

    it('should update user profile successfully', async () => {
      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith'
      }

      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            email: 'test@example.com',
            firstName: 'Jane',
            lastName: 'Smith'
          }
        }
      })
    })

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .send({ firstName: 'Jane' })
        .expect(401)

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'UNAUTHORIZED'
        }
      })
    })
  })

  describe('POST /api/v1/auth/forgot-password', () => {
    beforeEach(async () => {
      // Register a user
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'StrongPass123!',
          firstName: 'John',
          lastName: 'Doe'
        })
    })

    it('should send reset email for existing user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'test@example.com' })
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'If the email exists, a reset link has been sent'
      })
    })

    it('should not reveal if email exists or not', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'If the email exists, a reset link has been sent'
      })
    })

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('POST /api/v1/auth/reset-password', () => {
    let resetToken: string

    beforeEach(async () => {
      // Register a user and request password reset
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'StrongPass123!',
          firstName: 'John',
          lastName: 'Doe'
        })

      await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'test@example.com' })

      // In a real scenario, we'd get the token from email
      // For testing, we'll simulate a valid token
      resetToken = 'valid-reset-token-123'
    })

    it('should reset password with valid token', async () => {
      const resetData = {
        token: resetToken,
        newPassword: 'NewStrongPass123!'
      }

      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send(resetData)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'Password reset successfully'
      })
    })

    it('should return 400 for invalid token', async () => {
      const resetData = {
        token: 'invalid-token',
        newPassword: 'NewStrongPass123!'
      }

      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send(resetData)
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: 'Invalid or expired reset token',
          code: 'VALIDATION_ERROR'
        }
      })
    })

    it('should return 400 for weak new password', async () => {
      const resetData = {
        token: resetToken,
        newPassword: 'weak'
      }

      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send(resetData)
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: 'Password must be at least 8 characters with uppercase, lowercase, and number',
          code: 'VALIDATION_ERROR'
        }
      })
    })
  })

  describe('POST /api/v1/auth/verify-email', () => {
    let verificationToken: string

    beforeEach(async () => {
      // Register a user
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'StrongPass123!',
          firstName: 'John',
          lastName: 'Doe'
        })

      // In a real scenario, we'd get the token from email
      // For testing, we'll simulate a valid token
      verificationToken = 'valid-verification-token-123'
    })

    it('should verify email with valid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: verificationToken })
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'Email verified successfully'
      })
    })

    it('should return 400 for invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: 'invalid-token' })
        .expect(400)

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: 'Invalid or expired verification token',
          code: 'VALIDATION_ERROR'
        }
      })
    })
  })
})

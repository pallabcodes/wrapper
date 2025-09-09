import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals'
import request from 'supertest'
import express from 'express'
import { authRouter } from '../../auth/authRoutes'
import { logger } from '@ecommerce-enterprise/core'

// Create test app
const app = express()
app.use(express.json())
app.use('/auth', authRouter)

describe('Auth API Simple Integration Tests', () => {
  let authToken: string
  let refreshToken: string

  beforeAll(async () => {
    logger.info('Setting up simple auth integration tests')
  })

  afterAll(async () => {
    logger.info('Cleaning up simple auth integration tests')
  })

  beforeEach(async () => {
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

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBeDefined()
      expect(response.body.data).toBeDefined()
      expect(response.body.data.user).toBeDefined()
      expect(response.body.data.tokens).toBeDefined()
      expect(response.body.data.user.email).toBe(userData.email)
      expect(response.body.data.user.firstName).toBe(userData.firstName)
      expect(response.body.data.user.lastName).toBe(userData.lastName)
      expect(response.body.data.tokens.accessToken).toBeDefined()
      expect(response.body.data.tokens.refreshToken).toBeDefined()

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

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('already exists')
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

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBeDefined()
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

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBeDefined()
      expect(response.body.data).toBeDefined()
      expect(response.body.data.user).toBeDefined()
      expect(response.body.data.tokens).toBeDefined()
      expect(response.body.data.user.email).toBe(loginData.email)
      expect(response.body.data.tokens.accessToken).toBeDefined()
      expect(response.body.data.tokens.refreshToken).toBeDefined()

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

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Invalid credentials')
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

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBeDefined()
      expect(response.body.data).toBeDefined()
      expect(response.body.data.accessToken).toBeDefined()
      expect(response.body.data.refreshToken).toBeDefined()
      expect(response.body.data.expiresIn).toBeDefined()
    })

    it('should handle invalid refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh-token')
        .send({ refreshToken: 'invalid-token' })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Invalid refresh token')
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

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBeDefined()
      expect(response.body.data).toBeDefined()
      expect(response.body.data.email).toBe('profile@example.com')
      expect(response.body.data.firstName).toBe('Profile')
      expect(response.body.data.lastName).toBe('User')
    })

    it('should handle missing authorization header', async () => {
      const response = await request(app)
        .get('/auth/me')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('No token provided')
    })

    it('should handle invalid token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Invalid token')
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

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBeDefined()
      expect(response.body.data).toBeDefined()
      expect(response.body.data.firstName).toBe('Updated')
      expect(response.body.data.lastName).toBe('Name')
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

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('No token provided')
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

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('Password changed successfully')
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

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('No token provided')
    })
  })

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .send({ refreshToken: 'some-token' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('Logout successful')
    })
  })

  describe('POST /auth/forgot-password', () => {
    it('should handle forgot password request', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'test@example.com' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('Password reset email sent')
    })
  })
})

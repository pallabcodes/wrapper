/**
 * Auth Middleware Unit Tests
 * 
 * Tests all middleware functions with proper mocking and error handling.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { authenticateToken, requireRole } from '../../middleware/auth'
import { env } from '../../config/env'

type MockUser = { userId: string; email?: string; role?: string }

// Mock dependencies
jest.mock('jsonwebtoken')
jest.mock('../../config/env', () => ({
  env: {
    JWT_SECRET: 'test-secret'
  }
}))

const mockJwt = jwt as jest.Mocked<typeof jwt>

describe('AuthMiddleware', () => {
  let mockRequest: Partial<Request> & { user?: MockUser }
  let mockResponse: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockRequest = {
      headers: {},
      user: undefined
    }
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    } as Partial<Response>
    
    mockNext = jest.fn()
  })

  describe('authenticateToken', () => {
    it('should authenticate valid token successfully', () => {
      // Arrange
      const mockUser = { userId: 'user-id', email: 'test@example.com' }
      const token = 'valid-token'
      mockRequest.headers = {
        authorization: `Bearer ${token}`
      }
      mockJwt.verify.mockReturnValue(mockUser)

      // Act
      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(mockJwt.verify).toHaveBeenCalledWith(token, env.JWT_SECRET)
      expect(mockRequest.user).toEqual(mockUser)
      expect(mockNext).toHaveBeenCalled()
      expect(mockResponse.status).not.toHaveBeenCalled()
      expect(mockResponse.json).not.toHaveBeenCalled()
    })

    it('should handle missing authorization header', () => {
      // Arrange
      mockRequest.headers = {}

      // Act
      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Access token required' })
      expect(mockNext).not.toHaveBeenCalled()
      expect(mockJwt.verify).not.toHaveBeenCalled()
    })

    it('should handle authorization header without Bearer prefix', () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'invalid-token'
      }

      // Act
      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Access token required' })
      expect(mockNext).not.toHaveBeenCalled()
      expect(mockJwt.verify).not.toHaveBeenCalled()
    })

    it('should handle empty authorization header', () => {
      // Arrange
      mockRequest.headers = {
        authorization: ''
      }

      // Act
      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Access token required' })
      expect(mockNext).not.toHaveBeenCalled()
      expect(mockJwt.verify).not.toHaveBeenCalled()
    })

    it('should handle invalid token', () => {
      // Arrange
      const token = 'invalid-token'
      mockRequest.headers = {
        authorization: `Bearer ${token}`
      }
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token')
      })

      // Act
      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(mockJwt.verify).toHaveBeenCalledWith(token, env.JWT_SECRET)
      expect(mockResponse.status).toHaveBeenCalledWith(403)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' })
      expect(mockNext).not.toHaveBeenCalled()
      expect(mockRequest.user).toBeUndefined()
    })

    it('should handle expired token', () => {
      // Arrange
      const token = 'expired-token'
      mockRequest.headers = {
        authorization: `Bearer ${token}`
      }
      mockJwt.verify.mockImplementation(() => {
        throw new jwt.TokenExpiredError('Token expired', new Date())
      })

      // Act
      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(mockJwt.verify).toHaveBeenCalledWith(token, env.JWT_SECRET)
      expect(mockResponse.status).toHaveBeenCalledWith(403)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' })
      expect(mockNext).not.toHaveBeenCalled()
      expect(mockRequest.user).toBeUndefined()
    })

    it('should handle malformed token', () => {
      // Arrange
      const token = 'malformed-token'
      mockRequest.headers = {
        authorization: `Bearer ${token}`
      }
      mockJwt.verify.mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Malformed token')
      })

      // Act
      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(mockJwt.verify).toHaveBeenCalledWith(token, env.JWT_SECRET)
      expect(mockResponse.status).toHaveBeenCalledWith(403)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' })
      expect(mockNext).not.toHaveBeenCalled()
      expect((mockRequest as any).user).toBeUndefined()
    })

          it('should handle authorization header with extra spaces', () => {
        // Arrange
        const token = 'valid-token'
        mockRequest.headers = {
          authorization: `  Bearer  ${token}  `
        }
        mockJwt.verify.mockImplementation(() => {
          throw new Error('Invalid token')
        })

        // Act
        authenticateToken(mockRequest as Request, mockResponse as Response, mockNext)

        // Assert
        // With header "  Bearer  token  ", split(' ') creates ["", "", "Bearer", "", "token", ""]
        // So [1] would be an empty string, which means no token is extracted
        expect(mockResponse.status).toHaveBeenCalledWith(401)
        expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Access token required' })
        expect(mockNext).not.toHaveBeenCalled()
        expect((mockRequest as any).user).toBeUndefined()
      })
  })

  describe('requireRole', () => {
    it('should allow access for user with required role', () => {
      // Arrange
      const mockUser = { userId: 'user-id', role: 'admin' }
      mockRequest.user = mockUser
      const requireAdmin = requireRole('admin')

      // Act
      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(mockNext).toHaveBeenCalled()
      expect(mockResponse.status).not.toHaveBeenCalled()
      expect(mockResponse.json).not.toHaveBeenCalled()
    })

    it('should deny access for user without required role', () => {
      // Arrange
      const mockUser = { userId: 'user-id', role: 'user' }
      mockRequest.user = mockUser
      const requireAdmin = requireRole('admin')

      // Act
      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should deny access for user with no role', () => {
      // Arrange
      const mockUser = { userId: 'user-id' }
      mockRequest.user = mockUser
      const requireAdmin = requireRole('admin')

      // Act
      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should deny access when no user is present', () => {
      // Arrange
      mockRequest.user = undefined
      const requireAdmin = requireRole('admin')

      // Act
      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should allow access for different roles', () => {
      // Arrange
      const mockUser = { userId: 'user-id', role: 'moderator' }
      mockRequest.user = mockUser
      const requireModerator = requireRole('moderator')

      // Act
      requireModerator(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(mockNext).toHaveBeenCalled()
      expect(mockResponse.status).not.toHaveBeenCalled()
      expect(mockResponse.json).not.toHaveBeenCalled()
    })

    it('should handle case-sensitive role matching', () => {
      // Arrange
      const mockUser = { userId: 'user-id', role: 'Admin' }
      mockRequest.user = mockUser
      const requireAdmin = requireRole('admin')

      // Act
      requireAdmin(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403)
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should handle empty role string', () => {
      // Arrange
      const mockUser = { userId: 'user-id', role: '' }
      ;(mockRequest as any).user = mockUser
      const requireEmpty = requireRole('')

      // Act
      requireEmpty(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(mockNext).toHaveBeenCalled()
      expect(mockResponse.status).not.toHaveBeenCalled()
      expect(mockResponse.json).not.toHaveBeenCalled()
    })
  })
})

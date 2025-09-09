/**
 * Auth Controller Unit Tests
 * 
 * Tests all controller methods with proper mocking and error handling.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { Request, Response } from 'express'
import { authService } from '../../modules/auth/authService'
import { validateSchema } from '../../middleware/validation'
import { createSuccessResponse, createErrorResponse } from '../../utils/responseWrapper'
import {
  registerUser,
  loginUser,
  getUserProfile,
  changePassword,
  refreshToken
} from '../../modules/auth/authController'
import type { RegisterData, LoginData, ChangePasswordData } from '../../modules/auth/authTypes'

// Mock dependencies
jest.mock('../../modules/auth/authService')
jest.mock('../../middleware/validation')
jest.mock('../../utils/responseWrapper')

const mockAuthService = authService as jest.Mocked<typeof authService>
const mockValidateSchema = validateSchema as jest.MockedFunction<typeof validateSchema>
const mockCreateSuccessResponse = createSuccessResponse as jest.MockedFunction<typeof createSuccessResponse>
const mockCreateErrorResponse = createErrorResponse as jest.MockedFunction<typeof createErrorResponse>

describe('AuthController', () => {
  let mockRequest: Partial<Request> & { user?: { userId: string } }
  let mockResponse: Partial<Response>

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    
    // Setup mock request and response
    mockRequest = {
      body: {},
      user: { userId: 'test-user-id' }
    }
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    } as Partial<Response>
  })

  describe('registerUser', () => {
    const mockRegisterData: RegisterData = {
      email: 'test@example.com',
      password: 'TestPassword123!',
      firstName: 'John',
      lastName: 'Doe'
    }

    it('should register user successfully', async () => {
      // Arrange
      const mockResult = {
        user: {
          id: 'new-user-id',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          isEmailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresIn: 900
        }
      }
      mockValidateSchema.mockReturnValue(mockRegisterData)
      mockAuthService.register.mockResolvedValue(mockResult)
      mockCreateSuccessResponse.mockReturnValue(undefined)

      // Act
      await registerUser(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockValidateSchema).toHaveBeenCalledWith(expect.any(Object), mockRequest.body)
      expect(mockAuthService.register).toHaveBeenCalledWith(mockRegisterData)
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        mockResponse,
        mockResult,
        'User registered successfully'
      )
    })

    it('should handle validation errors', async () => {
      // Arrange
      const validationError = new Error('Validation failed')
      mockValidateSchema.mockImplementation(() => {
        throw validationError
      })
      mockCreateErrorResponse.mockReturnValue(undefined)

      // Act
      await registerUser(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        'Validation failed'
      )
    })

    it('should handle service errors', async () => {
      // Arrange
      const serviceError = new Error('User already exists')
      mockValidateSchema.mockReturnValue(mockRegisterData)
      mockAuthService.register.mockRejectedValue(serviceError)
      mockCreateErrorResponse.mockReturnValue(undefined)

      // Act
      await registerUser(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        'User already exists'
      )
    })

    it('should handle unknown errors', async () => {
      // Arrange
      mockValidateSchema.mockReturnValue(mockRegisterData)
      mockAuthService.register.mockRejectedValue('Unknown error')
      mockCreateErrorResponse.mockReturnValue(undefined)

      // Act
      await registerUser(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        'Registration failed'
      )
    })
  })

  describe('loginUser', () => {
    const mockLoginData: LoginData = {
      email: 'test@example.com',
      password: 'TestPassword123!'
    }

    it('should login user successfully', async () => {
      // Arrange
      const mockResult = {
        user: {
          id: 'user-id',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          isEmailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresIn: 900
        }
      }
      mockValidateSchema.mockReturnValue(mockLoginData)
      mockAuthService.login.mockResolvedValue(mockResult)
      mockCreateSuccessResponse.mockReturnValue(undefined)

      // Act
      await loginUser(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockValidateSchema).toHaveBeenCalledWith(expect.any(Object), mockRequest.body)
      expect(mockAuthService.login).toHaveBeenCalledWith(mockLoginData)
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        mockResponse,
        mockResult,
        'Login successful'
      )
    })

    it('should handle validation errors', async () => {
      // Arrange
      const validationError = new Error('Invalid credentials')
      mockValidateSchema.mockImplementation(() => {
        throw validationError
      })
      mockCreateErrorResponse.mockReturnValue(undefined)

      // Act
      await loginUser(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        'Invalid credentials'
      )
    })

    it('should handle service errors', async () => {
      // Arrange
      const serviceError = new Error('Invalid password')
      mockValidateSchema.mockReturnValue(mockLoginData)
      mockAuthService.login.mockRejectedValue(serviceError)
      mockCreateErrorResponse.mockReturnValue(undefined)

      // Act
      await loginUser(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        'Invalid password'
      )
    })
  })

  describe('getUserProfile', () => {
    it('should get user profile successfully', async () => {
      // Arrange
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isEmailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      mockAuthService.getUserById.mockResolvedValue(mockUser)
      mockCreateSuccessResponse.mockReturnValue(undefined)

      // Act
      await getUserProfile(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockAuthService.getUserById).toHaveBeenCalledWith('test-user-id')
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        mockResponse,
        mockUser,
        'User retrieved successfully'
      )
    })

    it('should handle unauthorized access', async () => {
      // Arrange
      mockRequest.user = undefined as any
      mockCreateErrorResponse.mockReturnValue(undefined)

      // Act
      await getUserProfile(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        'Unauthorized'
      )
      expect(mockAuthService.getUserById).not.toHaveBeenCalled()
    })

    it('should handle user not found', async () => {
      // Arrange
      mockAuthService.getUserById.mockResolvedValue(null)
      mockCreateErrorResponse.mockReturnValue(undefined)

      // Act
      await getUserProfile(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        'User not found'
      )
    })

    it('should handle service errors', async () => {
      // Arrange
      const serviceError = new Error('Database error')
      mockAuthService.getUserById.mockRejectedValue(serviceError)
      mockCreateErrorResponse.mockReturnValue(undefined)

      // Act
      await getUserProfile(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        'Database error'
      )
    })
  })

  describe('changePassword', () => {
    const mockChangePasswordData: ChangePasswordData = {
      currentPassword: 'OldPassword123!',
      newPassword: 'NewPassword123!'
    }

    it('should change password successfully', async () => {
      // Arrange
      mockValidateSchema.mockReturnValue(mockChangePasswordData)
      mockAuthService.changePassword.mockResolvedValue(undefined)
      mockCreateSuccessResponse.mockReturnValue(undefined)

      // Act
      await changePassword(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockValidateSchema).toHaveBeenCalledWith(expect.any(Object), mockRequest.body)
      expect(mockAuthService.changePassword).toHaveBeenCalledWith('test-user-id', mockChangePasswordData)
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        mockResponse,
        null,
        'Password changed successfully'
      )
    })

    it('should handle unauthorized access', async () => {
      // Arrange
      mockRequest.user = undefined as any
      mockCreateErrorResponse.mockReturnValue(undefined)

      // Act
      await changePassword(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        'Unauthorized'
      )
      expect(mockValidateSchema).not.toHaveBeenCalled()
    })

    it('should handle validation errors', async () => {
      // Arrange
      const validationError = new Error('Invalid password format')
      mockValidateSchema.mockImplementation(() => {
        throw validationError
      })
      mockCreateErrorResponse.mockReturnValue(undefined)

      // Act
      await changePassword(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        'Invalid password format'
      )
    })

    it('should handle service errors', async () => {
      // Arrange
      const serviceError = new Error('Current password is incorrect')
      mockValidateSchema.mockReturnValue(mockChangePasswordData)
      mockAuthService.changePassword.mockRejectedValue(serviceError)
      mockCreateErrorResponse.mockReturnValue(undefined)

      // Act
      await changePassword(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        'Current password is incorrect'
      )
    })
  })

  describe('refreshToken', () => {
    const mockRefreshData = { refreshToken: 'valid-refresh-token' }

    it('should refresh token successfully', async () => {
      // Arrange
      const mockResult = { 
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 900
      }
      mockValidateSchema.mockReturnValue(mockRefreshData)
      mockAuthService.refreshToken.mockResolvedValue(mockResult)
      mockCreateSuccessResponse.mockReturnValue(undefined)

      // Act
      await refreshToken(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockValidateSchema).toHaveBeenCalledWith(expect.any(Object), mockRequest.body)
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith('valid-refresh-token')
      expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
        mockResponse,
        mockResult,
        'Token refreshed successfully'
      )
    })

    it('should handle validation errors', async () => {
      // Arrange
      const validationError = new Error('Invalid refresh token format')
      mockValidateSchema.mockImplementation(() => {
        throw validationError
      })
      mockCreateErrorResponse.mockReturnValue(undefined)

      // Act
      await refreshToken(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        'Invalid refresh token format'
      )
    })

    it('should handle service errors', async () => {
      // Arrange
      const serviceError = new Error('Invalid refresh token')
      mockValidateSchema.mockReturnValue(mockRefreshData)
      mockAuthService.refreshToken.mockRejectedValue(serviceError)
      mockCreateErrorResponse.mockReturnValue(undefined)

      // Act
      await refreshToken(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        'Invalid refresh token'
      )
    })

    it('should handle unknown errors', async () => {
      // Arrange
      mockValidateSchema.mockReturnValue(mockRefreshData)
      mockAuthService.refreshToken.mockRejectedValue('Unknown error')
      mockCreateErrorResponse.mockReturnValue(undefined)

      // Act
      await refreshToken(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockCreateErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        'Token refresh failed'
      )
    })
  })
})

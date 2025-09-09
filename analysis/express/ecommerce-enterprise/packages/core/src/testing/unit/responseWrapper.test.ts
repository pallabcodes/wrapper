import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { Response } from 'express'
import {
  createSuccessResponse,
  createErrorResponse,
  createNotFoundResponse,
  createValidationErrorResponse,
  createUnauthorizedResponse,
  createForbiddenResponse,
  createConflictResponse,
  createInternalErrorResponse,
  type ApiResponse,
  type ErrorResponse
} from '../../utils/responseWrapper'

describe('ResponseWrapper', () => {
  let mockResponse: Partial<Response>

  beforeEach(() => {
    jest.clearAllMocks()
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    } as Partial<Response>
  })

  describe('createSuccessResponse', () => {
    it('should create a success response with default values', () => {
      // Arrange
      const data = { id: 1, name: 'Test' }
      const message = 'Success'
      const statusCode = 200

      // Act
      createSuccessResponse(mockResponse as Response, data, message, statusCode)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data: { id: 1, name: 'Test' },
        timestamp: expect.any(String),
        meta: {
          version: '1.0.0',
          environment: expect.any(String)
        }
      })
    })

    it('should create a success response with custom status code', () => {
      // Arrange
      const data = { id: 1, name: 'Test' }
      const message = 'Created successfully'
      const statusCode = 201

      // Act
      createSuccessResponse(mockResponse as Response, data, message, statusCode)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(201)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Created successfully',
        data: { id: 1, name: 'Test' },
        timestamp: expect.any(String),
        meta: {
          version: '1.0.0',
          environment: expect.any(String)
        }
      })
    })

    it('should create a success response with default message and status', () => {
      // Arrange
      const data = { id: 1, name: 'Test' }

      // Act
      createSuccessResponse(mockResponse as Response, data)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data: { id: 1, name: 'Test' },
        timestamp: expect.any(String),
        meta: {
          version: '1.0.0',
          environment: expect.any(String)
        }
      })
    })

    it('should handle null data', () => {
      // Arrange
      const data = null

      // Act
      createSuccessResponse(mockResponse as Response, data)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data: null,
        timestamp: expect.any(String),
        meta: {
          version: '1.0.0',
          environment: expect.any(String)
        }
      })
    })

    it('should handle undefined data', () => {
      // Arrange
      const data = undefined

      // Act
      createSuccessResponse(mockResponse as Response, data)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data: undefined,
        timestamp: expect.any(String),
        meta: {
          version: '1.0.0',
          environment: expect.any(String)
        }
      })
    })
  })

  describe('createErrorResponse', () => {
    it('should create an error response with all parameters', () => {
      // Arrange
      const message = 'Something went wrong'
      const statusCode = 400
      const errorCode = 'VALIDATION_ERROR'
      const details = { field: 'email', issue: 'Invalid format' }

      // Act
      createErrorResponse(mockResponse as Response, message, statusCode, errorCode, details)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Something went wrong',
        timestamp: expect.any(String),
        errorCode: 'VALIDATION_ERROR',
        details: { field: 'email', issue: 'Invalid format' },
        meta: {
          version: '1.0.0',
          environment: expect.any(String)
        }
      })
    })

    it('should create an error response with default values', () => {
      // Arrange
      const message = 'Internal server error'

      // Act
      createErrorResponse(mockResponse as Response, message)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
        timestamp: expect.any(String),
        errorCode: undefined,
        details: undefined,
        meta: {
          version: '1.0.0',
          environment: expect.any(String)
        }
      })
    })

    it('should create an error response with custom status code', () => {
      // Arrange
      const message = 'Not found'
      const statusCode = 404

      // Act
      createErrorResponse(mockResponse as Response, message, statusCode)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not found',
        timestamp: expect.any(String),
        errorCode: undefined,
        details: undefined,
        meta: {
          version: '1.0.0',
          environment: expect.any(String)
        }
      })
    })

    it('should handle empty message', () => {
      // Arrange
      const message = ''

      // Act
      createErrorResponse(mockResponse as Response, message)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: '',
        timestamp: expect.any(String),
        errorCode: undefined,
        details: undefined,
        meta: {
          version: '1.0.0',
          environment: expect.any(String)
        }
      })
    })
  })

  describe('createNotFoundResponse', () => {
    it('should create a not found response with default resource name', () => {
      // Act
      createNotFoundResponse(mockResponse as Response)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Resource not found',
        timestamp: expect.any(String),
        errorCode: 'NOT_FOUND',
        details: undefined,
        meta: {
          version: '1.0.0',
          environment: expect.any(String)
        }
      })
    })

    it('should create a not found response with custom resource name', () => {
      // Act
      createNotFoundResponse(mockResponse as Response, 'User')

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
        timestamp: expect.any(String),
        errorCode: 'NOT_FOUND',
        details: undefined,
        meta: {
          version: '1.0.0',
          environment: expect.any(String)
        }
      })
    })
  })

  describe('createValidationErrorResponse', () => {
    it('should create a validation error response with details', () => {
      // Arrange
      const details = {
        email: 'Invalid email format',
        password: 'Password must be at least 8 characters'
      }

      // Act
      createValidationErrorResponse(mockResponse as Response, details)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        timestamp: expect.any(String),
        errorCode: 'VALIDATION_ERROR',
        details: {
          email: 'Invalid email format',
          password: 'Password must be at least 8 characters'
        },
        meta: {
          version: '1.0.0',
          environment: expect.any(String)
        }
      })
    })

    it('should create a validation error response with empty details', () => {
      // Arrange
      const details = {}

      // Act
      createValidationErrorResponse(mockResponse as Response, details)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        timestamp: expect.any(String),
        errorCode: 'VALIDATION_ERROR',
        details: {},
        meta: {
          version: '1.0.0',
          environment: expect.any(String)
        }
      })
    })
  })

  describe('createUnauthorizedResponse', () => {
    it('should create an unauthorized response with default message', () => {
      // Act
      createUnauthorizedResponse(mockResponse as Response)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized',
        timestamp: expect.any(String),
        errorCode: 'UNAUTHORIZED',
        details: undefined,
        meta: {
          version: '1.0.0',
          environment: expect.any(String)
        }
      })
    })

    it('should create an unauthorized response with custom message', () => {
      // Act
      createUnauthorizedResponse(mockResponse as Response, 'Invalid credentials')

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid credentials',
        timestamp: expect.any(String),
        errorCode: 'UNAUTHORIZED',
        details: undefined,
        meta: {
          version: '1.0.0',
          environment: expect.any(String)
        }
      })
    })
  })

  describe('createForbiddenResponse', () => {
    it('should create a forbidden response with default message', () => {
      // Act
      createForbiddenResponse(mockResponse as Response)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Forbidden',
        timestamp: expect.any(String),
        errorCode: 'FORBIDDEN',
        details: undefined,
        meta: {
          version: '1.0.0',
          environment: expect.any(String)
        }
      })
    })

    it('should create a forbidden response with custom message', () => {
      // Act
      createForbiddenResponse(mockResponse as Response, 'Insufficient permissions')

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Insufficient permissions',
        timestamp: expect.any(String),
        errorCode: 'FORBIDDEN',
        details: undefined,
        meta: {
          version: '1.0.0',
          environment: expect.any(String)
        }
      })
    })
  })

  describe('createConflictResponse', () => {
    it('should create a conflict response with default message', () => {
      // Act
      createConflictResponse(mockResponse as Response)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(409)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Conflict',
        timestamp: expect.any(String),
        errorCode: 'CONFLICT',
        details: undefined,
        meta: {
          version: '1.0.0',
          environment: expect.any(String)
        }
      })
    })

    it('should create a conflict response with custom message and details', () => {
      // Arrange
      const message = 'Email already exists'
      const details = { email: 'user@example.com' }

      // Act
      createConflictResponse(mockResponse as Response, message, details)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(409)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email already exists',
        timestamp: expect.any(String),
        errorCode: 'CONFLICT',
        details: { email: 'user@example.com' },
        meta: {
          version: '1.0.0',
          environment: expect.any(String)
        }
      })
    })
  })

  describe('createInternalErrorResponse', () => {
    it('should create an internal error response with default message', () => {
      // Act
      createInternalErrorResponse(mockResponse as Response)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
        timestamp: expect.any(String),
        errorCode: 'INTERNAL_ERROR',
        details: undefined,
        meta: {
          version: '1.0.0',
          environment: expect.any(String)
        }
      })
    })

    it('should create an internal error response with custom message', () => {
      // Act
      createInternalErrorResponse(mockResponse as Response, 'Database connection failed')

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Database connection failed',
        timestamp: expect.any(String),
        errorCode: 'INTERNAL_ERROR',
        details: undefined,
        meta: {
          version: '1.0.0',
          environment: expect.any(String)
        }
      })
    })
  })

  describe('Type definitions', () => {
    it('should have correct ApiResponse type structure', () => {
      // This test ensures the type structure is correct
      const response: ApiResponse<{ id: number }> = {
        success: true,
        message: 'Test',
        data: { id: 1 },
        timestamp: '2023-01-01T00:00:00.000Z',
        meta: {
          version: '1.0.0',
          environment: 'test'
        }
      }

      expect(response.success).toBe(true)
      expect(response.message).toBe('Test')
      expect(response.data).toEqual({ id: 1 })
      expect(response.timestamp).toBe('2023-01-01T00:00:00.000Z')
      expect(response.meta).toEqual({
        version: '1.0.0',
        environment: 'test'
      })
    })

    it('should have correct ErrorResponse type structure', () => {
      // This test ensures the error type structure is correct
      const errorResponse: ErrorResponse = {
        success: false,
        message: 'Error',
        timestamp: '2023-01-01T00:00:00.000Z',
        errorCode: 'TEST_ERROR',
        details: { field: 'test' },
        meta: {
          version: '1.0.0',
          environment: 'test'
        }
      }

      expect(errorResponse.success).toBe(false)
      expect(errorResponse.message).toBe('Error')
      expect(errorResponse.errorCode).toBe('TEST_ERROR')
      expect(errorResponse.details).toEqual({ field: 'test' })
      expect(errorResponse.timestamp).toBe('2023-01-01T00:00:00.000Z')
      expect(errorResponse.meta).toEqual({
        version: '1.0.0',
        environment: 'test'
      })
    })
  })
})

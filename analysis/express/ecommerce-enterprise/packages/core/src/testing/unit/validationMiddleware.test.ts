/**
 * Validation Middleware Unit Tests
 * 
 * Tests all validation middleware functions with proper mocking and error handling.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { validateBody, validateQuery, validateParams, validateSchema } from '../../middleware/validation'

describe('ValidationMiddleware', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockRequest = {
      body: {},
      query: {},
      params: {}
    }
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    } as Partial<Response>
    
    mockNext = jest.fn()
  })

  describe('validateBody', () => {
    const userSchema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      age: z.number().min(18)
    })

    it('should validate valid body data successfully', () => {
      // Arrange
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25
      }
      mockRequest.body = validData
      const validateUserBody = validateBody(userSchema)

      // Act
      validateUserBody(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(mockRequest.body).toEqual(validData)
      expect(mockNext).toHaveBeenCalled()
      expect(mockResponse.status).not.toHaveBeenCalled()
      expect(mockResponse.json).not.toHaveBeenCalled()
    })

    it('should handle invalid body data', () => {
      // Arrange
      const invalidData = {
        name: '',
        email: 'invalid-email',
        age: 15
      }
      mockRequest.body = invalidData
      const validateUserBody = validateBody(userSchema)

      // Act
      validateUserBody(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        details: expect.any(Array)
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should handle missing required fields', () => {
      // Arrange
      const incompleteData = {
        name: 'John Doe'
        // missing email and age
      }
      mockRequest.body = incompleteData
      const validateUserBody = validateBody(userSchema)

      // Act
      validateUserBody(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        details: expect.any(Array)
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should handle empty body', () => {
      // Arrange
      mockRequest.body = {}
      const validateUserBody = validateBody(userSchema)

      // Act
      validateUserBody(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        details: expect.any(Array)
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should handle non-ZodError exceptions', () => {
      // Arrange
      const schemaWithError = z.object({
        name: z.string().transform(() => {
          throw new Error('Custom error')
        })
      })
      mockRequest.body = { name: 'test' }
      const validateWithError = validateBody(schemaWithError)

      // Act
      validateWithError(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
      expect(mockResponse.status).not.toHaveBeenCalled()
      expect(mockResponse.json).not.toHaveBeenCalled()
    })
  })

  describe('validateQuery', () => {
    const paginationSchema = z.object({
      page: z.string().transform(Number).pipe(z.number().min(1)),
      limit: z.string().transform(Number).pipe(z.number().min(1).max(100)),
      search: z.string().optional()
    })

    it('should validate valid query parameters successfully', () => {
      // Arrange
      const validQuery = {
        page: '1',
        limit: '20',
        search: 'test'
      }
      mockRequest.query = validQuery
      const validatePaginationQuery = validateQuery(paginationSchema)

      // Act
      validatePaginationQuery(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(mockRequest.query).toEqual({
        page: 1,
        limit: 20,
        search: 'test'
      })
      expect(mockNext).toHaveBeenCalled()
      expect(mockResponse.status).not.toHaveBeenCalled()
      expect(mockResponse.json).not.toHaveBeenCalled()
    })

    it('should handle invalid query parameters', () => {
      // Arrange
      const invalidQuery = {
        page: '0',
        limit: '200',
        search: 'test'
      }
      mockRequest.query = invalidQuery
      const validatePaginationQuery = validateQuery(paginationSchema)

      // Act
      validatePaginationQuery(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        details: expect.any(Array)
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should handle missing required query parameters', () => {
      // Arrange
      const incompleteQuery = {
        search: 'test'
        // missing page and limit
      }
      mockRequest.query = incompleteQuery
      const validatePaginationQuery = validateQuery(paginationSchema)

      // Act
      validatePaginationQuery(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        details: expect.any(Array)
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should handle empty query parameters', () => {
      // Arrange
      mockRequest.query = {}
      const validatePaginationQuery = validateQuery(paginationSchema)

      // Act
      validatePaginationQuery(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        details: expect.any(Array)
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should handle non-ZodError exceptions in query validation', () => {
      // Arrange
      const schemaWithError = z.object({
        page: z.string().transform(() => {
          throw new Error('Custom query error')
        })
      })
      mockRequest.query = { page: '1' }
      const validateWithError = validateQuery(schemaWithError)

      // Act
      validateWithError(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
      expect(mockResponse.status).not.toHaveBeenCalled()
      expect(mockResponse.json).not.toHaveBeenCalled()
    })
  })

  describe('validateParams', () => {
    const idSchema = z.object({
      id: z.string().uuid(),
      type: z.enum(['user', 'product', 'order'])
    })

    it('should validate valid path parameters successfully', () => {
      // Arrange
      const validParams = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: 'user'
      }
      mockRequest.params = validParams
      const validateIdParams = validateParams(idSchema)

      // Act
      validateIdParams(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(mockRequest.params).toEqual(validParams)
      expect(mockNext).toHaveBeenCalled()
      expect(mockResponse.status).not.toHaveBeenCalled()
      expect(mockResponse.json).not.toHaveBeenCalled()
    })

    it('should handle invalid path parameters', () => {
      // Arrange
      const invalidParams = {
        id: 'invalid-uuid',
        type: 'invalid-type'
      }
      mockRequest.params = invalidParams
      const validateIdParams = validateParams(idSchema)

      // Act
      validateIdParams(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        details: expect.any(Array)
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should handle missing required path parameters', () => {
      // Arrange
      const incompleteParams = {
        id: '123e4567-e89b-12d3-a456-426614174000'
        // missing type
      }
      mockRequest.params = incompleteParams
      const validateIdParams = validateParams(idSchema)

      // Act
      validateIdParams(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        details: expect.any(Array)
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should handle empty path parameters', () => {
      // Arrange
      mockRequest.params = {}
      const validateIdParams = validateParams(idSchema)

      // Act
      validateIdParams(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        details: expect.any(Array)
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should handle non-ZodError exceptions in params validation', () => {
      // Arrange
      const schemaWithError = z.object({
        id: z.string().transform(() => {
          throw new Error('Custom params error')
        })
      })
      mockRequest.params = { id: 'test' }
      const validateWithError = validateParams(schemaWithError)

      // Act
      validateWithError(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
      expect(mockResponse.status).not.toHaveBeenCalled()
      expect(mockResponse.json).not.toHaveBeenCalled()
    })
  })

  describe('validateSchema', () => {
    const testSchema = z.object({
      name: z.string(),
      value: z.number()
    })

    it('should validate valid data successfully', () => {
      // Arrange
      const validData = {
        name: 'test',
        value: 42
      }

      // Act
      const result = validateSchema(testSchema, validData)

      // Assert
      expect(result).toEqual(validData)
    })

    it('should throw ZodError for invalid data', () => {
      // Arrange
      const invalidData = {
        name: 'test',
        value: 'not-a-number'
      }

      // Act & Assert
      expect(() => validateSchema(testSchema, invalidData)).toThrow(z.ZodError)
    })

    it('should throw ZodError for missing required fields', () => {
      // Arrange
      const incompleteData = {
        name: 'test'
        // missing value
      }

      // Act & Assert
      expect(() => validateSchema(testSchema, incompleteData)).toThrow(z.ZodError)
    })

    it('should throw ZodError for empty object', () => {
      // Arrange
      const emptyData = {}

      // Act & Assert
      expect(() => validateSchema(testSchema, emptyData)).toThrow(z.ZodError)
    })

    it('should handle complex nested schemas', () => {
      // Arrange
      const complexSchema = z.object({
        user: z.object({
          name: z.string(),
          profile: z.object({
            age: z.number(),
            email: z.string().email()
          })
        }),
        settings: z.array(z.string())
      })

      const validComplexData = {
        user: {
          name: 'John',
          profile: {
            age: 30,
            email: 'john@example.com'
          }
        },
        settings: ['theme', 'notifications']
      }

      // Act
      const result = validateSchema(complexSchema, validComplexData)

      // Assert
      expect(result).toEqual(validComplexData)
    })

    it('should handle array validation', () => {
      // Arrange
      const arraySchema = z.array(z.number().positive())

      const validArray = [1, 2, 3, 4, 5]

      // Act
      const result = validateSchema(arraySchema, validArray)

      // Assert
      expect(result).toEqual(validArray)
    })

    it('should throw ZodError for invalid array', () => {
      // Arrange
      const arraySchema = z.array(z.number().positive())

      const invalidArray = [1, -2, 3, 0, 5]

      // Act & Assert
      expect(() => validateSchema(arraySchema, invalidArray)).toThrow(z.ZodError)
    })
  })
})

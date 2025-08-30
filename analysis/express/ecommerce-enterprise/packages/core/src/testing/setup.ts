/**
 * Test Setup - Enterprise Grade Testing
 * 
 * Global test setup and utilities for unit, integration, and E2E tests.
 * Following internal team testing standards.
 */

import { jest } from '@jest/globals'
import { Request, Response } from 'express'

// ============================================================================
// MOCK SETUP
// ============================================================================

// Mock database connections for unit tests
jest.mock('../database/client', () => ({
  db: {},
  pool: {
    connect: jest.fn(),
    end: jest.fn()
  },
  getDatabaseClient: jest.fn(() => ({})),
  closeDatabaseConnection: jest.fn(),
  checkDatabaseHealth: jest.fn(() => Promise.resolve(true)),
  withTransaction: jest.fn(),
  runMigrations: jest.fn()
}))

jest.mock('../database/mongodb/client', () => ({
  connectMongoDB: jest.fn(),
  getMongoClient: jest.fn(() => ({})),
  closeMongoConnection: jest.fn(),
  checkMongoHealth: jest.fn(() => Promise.resolve(true))
}))

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}))

// ============================================================================
// TEST UTILITIES
// ============================================================================

export const createTestUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'customer',
  isActive: true,
  isEmailVerified: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

export const createTestProduct = (overrides = {}) => ({
  id: 'test-product-id',
  name: 'Test Product',
  description: 'A test product',
  price: 99.99,
  currency: 'USD',
  category: 'electronics',
  sku: 'TEST-001',
  stockQuantity: 50,
  isActive: true,
  images: [],
  tags: [],
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

export const mockRequest = (overrides = {}): Partial<Request> => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  ...overrides
}) as Partial<Request>

export const mockResponse = (): Partial<Response> => {
  const res = {} as any
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  res.set = jest.fn().mockReturnValue(res)
  return res as Partial<Response>
}

export const expectError = async (fn: () => Promise<any>, expectedMessage: string) => {
  try {
    await fn()
    throw new Error('Expected function to throw an error')
  } catch (error) {
    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toContain(expectedMessage)
  }
}

// ============================================================================
// TEST DATABASE SETUP (FOR INTEGRATION TESTS ONLY)
// ============================================================================

export const setupTestDatabase = async () => {
  // For unit tests, we don't need real database connections
  // This is only used for integration tests
  console.log('Test database setup skipped for unit tests')
}

export const teardownTestDatabase = async () => {
  // For unit tests, we don't need real database connections
  // This is only used for integration tests
  console.log('Test database teardown skipped for unit tests')
}

export const clearTestData = async () => {
  // For unit tests, we don't need real database connections
  // This is only used for integration tests
  console.log('Test data cleanup skipped for unit tests')
}

// ============================================================================
// PERFORMANCE TESTING UTILITIES
// ============================================================================

export const measurePerformance = async (fn: () => Promise<any>, iterations = 1000) => {
  const start = performance.now()
  
  for (let i = 0; i < iterations; i++) {
    await fn()
  }
  
  const end = performance.now()
  const averageTime = (end - start) / iterations
  
  return {
    totalTime: end - start,
    averageTime,
    iterations
  }
}

export const loadTest = async (fn: () => Promise<any>, concurrency = 10, duration = 5000) => {
  const start = Date.now()
  const results: any[] = []
  const errors: Error[] = []
  
  const execute = async () => {
    while (Date.now() - start < duration) {
      try {
        const result = await fn()
        results.push(result)
      } catch (error) {
        errors.push(error as Error)
      }
    }
  }
  
  const promises = Array(concurrency).fill(null).map(() => execute())
  await Promise.all(promises)
  
  return {
    totalRequests: results.length,
    errors: errors.length,
    successRate: results.length / (results.length + errors.length),
    duration: Date.now() - start,
    requestsPerSecond: results.length / ((Date.now() - start) / 1000)
  }
}

// ============================================================================
// SECURITY TESTING UTILITIES
// ============================================================================

export const generateMaliciousInput = () => ({
  sqlInjection: "'; DROP TABLE users; --",
  xss: '<script>alert("XSS")</script>',
  pathTraversal: '../../../etc/passwd',
  commandInjection: '; rm -rf /;',
  noSqlInjection: { $where: 'function() { return true; }' }
})

export const testInputValidation = async (validator: (input: any) => boolean, validInputs: any[], invalidInputs: any[]) => {
  // Test valid inputs
  for (const input of validInputs) {
    expect(validator(input)).toBe(true)
  }
  
  // Test invalid inputs
  for (const input of invalidInputs) {
    expect(validator(input)).toBe(false)
  }
}

// ============================================================================
// GLOBAL TEST CONFIGURATION
// ============================================================================

beforeAll(async () => {
  // Global test setup
  console.log('🧪 Setting up test environment...')
})

afterAll(async () => {
  // Global test cleanup
  console.log('🧹 Cleaning up test environment...')
})

beforeEach(async () => {
  // Reset mocks before each test
  jest.clearAllMocks()
})

afterEach(async () => {
  // Cleanup after each test
  jest.clearAllMocks()
})

// ============================================================================
// TEST ENVIRONMENT VARIABLES
// ============================================================================

process.env['NODE_ENV'] = 'test'
process.env['JWT_SECRET'] = 'test-jwt-secret'
process.env['JWT_REFRESH_SECRET'] = 'test-jwt-refresh-secret'
process.env['DATABASE_HOST'] = 'localhost'
process.env['DATABASE_PORT'] = '5432'
process.env['DATABASE_USER'] = 'test'
process.env['DATABASE_PASSWORD'] = 'test'
process.env['DATABASE_NAME'] = 'test_ecommerce'
process.env['MONGODB_URI'] = 'mongodb://localhost:27017/test_ecommerce'
process.env['REDIS_URL'] = 'redis://localhost:6379'

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestData,
  createTestUser,
  createTestProduct,
  mockRequest,
  mockResponse,
  expectError,
  measurePerformance,
  loadTest,
  generateMaliciousInput,
  testInputValidation
}

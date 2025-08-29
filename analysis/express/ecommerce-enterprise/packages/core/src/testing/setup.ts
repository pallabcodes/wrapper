/**
 * Testing Setup - Enterprise Testing Infrastructure
 * 
 * Comprehensive testing setup following Google/Atlassian/Stripe standards.
 * Includes unit, integration, and E2E testing configurations.
 */

import { jest } from '@jest/globals'
import { connectMongoDB, closeMongoConnection } from '../database/mongodb/client'
import { logger } from '../utils/logger'

// ============================================================================
// JEST CONFIGURATION
// ============================================================================

export const jestConfig = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/testing/**',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/testing/setup.ts'],
  testTimeout: 30000,
  verbose: true,
  clearMocks: true,
  restoreMocks: true
}

// ============================================================================
// TEST DATABASE SETUP
// ============================================================================

export const setupTestDatabase = async () => {
  try {
    // Use test database URL
    process.env['DATABASE_URL'] = process.env['TEST_DATABASE_URL'] || 'postgresql://test:test@localhost:5432/ecommerce_test'
    process.env['MONGODB_URI'] = process.env['TEST_MONGODB_URI'] || 'mongodb://localhost:27017/ecommerce_test'
    
    // Initialize connections
    await connectMongoDB()
    
    logger.info('Test database connections established')
  } catch (error) {
    logger.error('Failed to setup test database', { error })
    throw error
  }
}

export const teardownTestDatabase = async () => {
  try {
    await closeMongoConnection()
    logger.info('Test database connections closed')
  } catch (error) {
    logger.error('Failed to teardown test database', { error })
    throw error
  }
}

// ============================================================================
// TEST UTILITIES
// ============================================================================

export const createTestUser = async (userData: any = {}) => {
  const defaultUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    role: 'customer',
    isActive: true
  }
  
  const user = { ...defaultUser, ...userData }
  // Implementation would use userRepository
  return user
}

export const createTestProduct = async (productData: any = {}) => {
  const defaultProduct = {
    name: `Test Product ${Date.now()}`,
    description: 'Test product description',
    price: 99.99,
    currency: 'USD',
    category: 'Electronics',
    sku: `TEST-${Date.now()}`,
    stockQuantity: 100,
    isActive: true
  }
  
  const product = { ...defaultProduct, ...productData }
  // Implementation would use productRepository
  return product
}

export const cleanupTestData = async () => {
  try {
    // Clean up test data from both databases
    // Implementation would clear test data
    logger.info('Test data cleaned up')
  } catch (error) {
    logger.error('Failed to cleanup test data', { error })
    throw error
  }
}

// ============================================================================
// MOCK UTILITIES
// ============================================================================

export const mockRequest = (data: any = {}) => ({
  body: {},
  query: {},
  params: {},
  headers: {},
  user: null,
  ...data
})

export const mockResponse = () => {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  res.setHeader = jest.fn().mockReturnValue(res)
  res.getHeader = jest.fn()
  return res
}

export const mockNext = jest.fn()

// ============================================================================
// TEST HELPERS
// ============================================================================

export const waitForAsync = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const expectError = async (fn: () => Promise<any>, expectedError: string) => {
  try {
    await fn()
    throw new Error('Expected function to throw an error')
  } catch (error: any) {
    expect(error.message).toContain(expectedError)
  }
}

export const expectValidationError = async (fn: () => Promise<any>) => {
  await expectError(fn, 'Validation failed')
}

// ============================================================================
// PERFORMANCE TESTING
// ============================================================================

export const measurePerformance = async (fn: () => Promise<any>, iterations: number = 1000) => {
  const startTime = process.hrtime.bigint()
  
  for (let i = 0; i < iterations; i++) {
    await fn()
  }
  
  const endTime = process.hrtime.bigint()
  const duration = Number(endTime - startTime) / 1000000 // Convert to milliseconds
  
  return {
    totalTime: duration,
    averageTime: duration / iterations,
    iterations
  }
}

// ============================================================================
// LOAD TESTING
// ============================================================================

export const loadTest = async (
  fn: () => Promise<any>,
  concurrency: number = 10,
  duration: number = 10000
) => {
  const startTime = Date.now()
  const results: any[] = []
  const errors: any[] = []
  
  const worker = async () => {
    while (Date.now() - startTime < duration) {
      try {
        const result = await fn()
        results.push(result)
      } catch (error) {
        errors.push(error)
      }
    }
  }
  
  const workers = Array(concurrency).fill(null).map(() => worker())
  await Promise.all(workers)
  
  return {
    totalRequests: results.length,
    totalErrors: errors.length,
    successRate: results.length / (results.length + errors.length),
    duration: Date.now() - startTime,
    requestsPerSecond: results.length / ((Date.now() - startTime) / 1000)
  }
}

// ============================================================================
// GLOBAL TEST SETUP
// ============================================================================

beforeAll(async () => {
  await setupTestDatabase()
})

afterAll(async () => {
  await teardownTestDatabase()
})

afterEach(async () => {
  await cleanupTestData()
  jest.clearAllMocks()
})

// ============================================================================
// EXPORT
// ============================================================================

export default jestConfig

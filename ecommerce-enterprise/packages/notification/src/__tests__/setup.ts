/**
 * Test Setup for Notification Microservice
 */

// Mock environment variables for testing
process.env['NODE_ENV'] = 'test'
process.env['PORT'] = '3002'
process.env['LOG_LEVEL'] = 'error'

// Mock external dependencies
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  })),
  format: {
    combine: jest.fn(),
    colorize: jest.fn(),
    timestamp: jest.fn(),
    printf: jest.fn(),
    errors: jest.fn(),
    json: jest.fn()
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn()
  }
}))

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log during tests
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
})

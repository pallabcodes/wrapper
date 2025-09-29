/**
 * Jest Test Setup
 * 
 * Global setup for all crypto tests including
 * environment configuration and cleanup.
 */

// Set test environment variables
process.env['NODE_ENV'] = 'test';
process.env['CRYPTO_AUDIT_FILE'] = './test-audit.log';
process.env['CRYPTO_LOG_LEVEL'] = 'error';

// Mock console methods for cleaner test output
const originalConsole = { ...console };

beforeAll(() => {
  // Suppress console output during tests unless explicitly enabled
  if (!process.env['DEBUG_TESTS']) {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  }
});

afterAll(() => {
  // Restore console methods
  Object.assign(console, originalConsole);
});

// Global test timeout
jest.setTimeout(30000);

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});

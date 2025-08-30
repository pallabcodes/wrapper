/**
 * Jest Configuration - Enterprise Grade Testing
 * 
 * Comprehensive testing setup for unit, integration, and E2E tests.
 * Following Google/Atlassian/Stripe/PayPal internal team standards.
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.(ts|js)',
    '**/*.(test|spec).(ts|js)'
  ],
  
  // File extensions
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // Transform configuration
  transform: {
    '^.+\\.(ts|js)$': 'ts-jest'
  },
  
  // Module name mapping
  moduleNameMapper: {
    '^@ecommerce-enterprise/(.*)$': '<rootDir>/packages/$1/src',
    '^@/(.*)$': '<rootDir>/apps/api/src/$1'
  },
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'packages/**/src/**/*.(ts|js)',
    'apps/**/src/**/*.(ts|js)',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**',
    '!**/__tests__/**',
    '!**/*.test.(ts|js)',
    '!**/*.spec.(ts|js)'
  ],
  
  // Coverage thresholds (enterprise standards)
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json'
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/packages/core/src/testing/setup.ts'
  ],
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks between tests
  restoreMocks: true,
  
  // Module directories
  moduleDirectories: ['node_modules', 'src'],
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  },
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],
  
  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ]
}

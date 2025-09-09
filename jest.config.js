module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json'
    }
  },
  roots: ['<rootDir>/packages'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts',
    '**/testing/**/*.test.ts'
  ],
  transform: {
    "^.+\\.ts$": "ts-jest"
  },
  collectCoverageFrom: [
    'packages/**/*.ts',
    '!packages/**/*.d.ts',
    '!packages/**/node_modules/**',
    '!packages/**/dist/**',
    '!packages/**/coverage/**',
    '!packages/**/testing/**/*.test.ts',
    '!packages/**/migrations/**',
    '!packages/**/scripts/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  setupFilesAfterEnv: ['<rootDir>/packages/core/src/testing/setup.ts'],
  moduleNameMapper: {
    '^@ecommerce-enterprise/(.*)$': '<rootDir>/packages/$1/src',
    '^@shared/(.*)$': '<rootDir>/packages/shared/src/$1',
    '^@types/(.*)$': '<rootDir>/packages/types/src/$1'
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/__tests__/e2e/'
  ],
  testTimeout: 10000,
  maxWorkers: 1
}

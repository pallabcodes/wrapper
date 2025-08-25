/**
 * Comprehensive Testing Setup for Enterprise Ecommerce Platform
 * 
 * This configuration sets up Google/Atlassian/Stripe level testing standards:
 * - Unit Tests (Jest/Vitest)
 * - Integration Tests (Supertest + Test Containers)
 * - E2E Tests (Playwright)
 * - Performance Tests (Artillery)
 * - Contract Tests (Pact)
 */

import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Global test configuration
    globals: true,
    environment: 'node',
    
    // TypeScript configuration
    typecheck: {
      tsconfig: './tsconfig.json'
    },
    
    // Test file patterns
    include: [
      'src/**/*.{test,spec}.{js,ts}',
      'tests/unit/**/*.{test,spec}.{js,ts}',
      'tests/integration/**/*.{test,spec}.{js,ts}'
    ],
    
    exclude: [
      'node_modules/**',
      'dist/**',
      'tests/e2e/**',
      'tests/performance/**',
      'tests/setup/**'  // Exclude setup files from unit tests
    ],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        'tests/**',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        'src/**/*.test.{js,ts}',
        'src/**/*.spec.{js,ts}'
      ]
    },

    // Test timeout
    testTimeout: 10000,
    hookTimeout: 10000,

    // Setup files
    setupFiles: [
      './tests/setup/unit-setup.ts',
      './tests/setup/integration-setup.ts'
    ],

    // Parallel execution
    threads: true,
    maxThreads: 4,

    // Reporter
    reporters: ['verbose'],
    outputFile: {
      json: './test-results/unit-results.json'
    }
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@tests': resolve(__dirname, './tests')
    }
  },

  esbuild: {
    target: 'node18'
  }
});

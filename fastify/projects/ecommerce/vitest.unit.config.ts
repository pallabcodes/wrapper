/**
 * Unit Tests Configuration
 * Isolated unit tests without database dependencies
 */

import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Global test configuration for unit tests only
    globals: true,
    environment: 'node',
    
    // TypeScript configuration
    typecheck: {
      tsconfig: './tsconfig.json'
    },
    
    // Test file patterns - unit tests only
    include: [
      'tests/unit/**/*.{test,spec}.{js,ts}'
    ],
    
    // Setup files - unit tests only (no database setup)
    setupFiles: [
      './tests/setup/unit-setup.ts'
    ],
    
    exclude: [
      'node_modules/**',
      'dist/**',
      'tests/e2e/**',
      'tests/integration/**',
      'tests/performance/**',
      'tests/setup/**'
    ],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage/unit',
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
    
    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Concurrency
    threads: true,
    maxConcurrency: 5,
    
    // Reporters
    reporters: ['verbose', 'json'],
    outputFile: {
      json: './test-results/unit-results.json'
    },
    
    // Watch mode
    watch: false,
    
    // Mock configuration
    clearMocks: true,
    restoreMocks: true,
    
    // Path resolution
    alias: {
      '@': resolve(__dirname, './src'),
      '@/shared': resolve(__dirname, './src/shared'),
      '@/domain': resolve(__dirname, './src/domain'),
      '@/application': resolve(__dirname, './src/application'),
      '@/infrastructure': resolve(__dirname, './src/infrastructure'),
      '@/modules': resolve(__dirname, './src/modules'),
      '@/api': resolve(__dirname, './src/api'),
      '@/config': resolve(__dirname, './config'),
      '@/tests': resolve(__dirname, './tests')
    }
  }
});

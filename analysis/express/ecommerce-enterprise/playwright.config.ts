/**
 * Playwright Configuration - Enterprise Grade E2E Testing
 * 
 * End-to-end testing configuration for the ecommerce platform.
 * Following internal team testing standards.
 */

import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './apps/api/src/__tests__/e2e',
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  
  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: 'http://localhost:3000',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Take screenshot on failure
    screenshot: 'only-on-failure',
    
    // Record video on failure
    video: 'retain-on-failure'
  },
  
  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    
    // Test against mobile viewports
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    },
    
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] }
    },
    
    // Test against branded browsers
    {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' }
    },
    
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' }
    }
  ],
  
  // Run your local dev server before starting the tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000
  },
  
  // Global test timeout
  timeout: 30000,
  
  // Expect timeout
  expect: {
    timeout: 5000
  },
  
  // Global setup and teardown
  globalSetup: require.resolve('./apps/api/src/__tests__/e2e/global-setup.ts'),
  globalTeardown: require.resolve('./apps/api/src/__tests__/e2e/global-teardown.ts'),
  
  // Test output directory
  outputDir: 'test-results/',
  
  // Test artifacts
  preserveOutput: 'always',
  
  // Test metadata
  metadata: {
    name: 'Ecommerce Enterprise E2E Tests',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  }
})

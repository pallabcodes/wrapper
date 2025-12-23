/**
 * Auth E2E Tests
 * 
 * End-to-end tests for authentication flows using Playwright.
 * Following internal team testing standards.
 */

import { test, expect } from '@playwright/test'

test.describe('Authentication E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/')
  })

  test.describe('User Registration Flow', () => {
    test('should register a new user successfully', async ({ page }) => {
      // Navigate to registration page
      await page.goto('/auth/register')
      
      // Fill registration form
      await page.fill('[data-testid="email-input"]', 'e2e-test@example.com')
      await page.fill('[data-testid="password-input"]', 'E2ETestPassword123!')
      await page.fill('[data-testid="firstName-input"]', 'E2E')
      await page.fill('[data-testid="lastName-input"]', 'Test')
      
      // Submit form
      await page.click('[data-testid="register-button"]')
      
      // Wait for success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
      await expect(page.locator('[data-testid="success-message"]')).toContainText('User registered successfully')
      
      // Verify user is logged in
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
    })

    test('should show validation errors for invalid input', async ({ page }) => {
      // Navigate to registration page
      await page.goto('/auth/register')
      
      // Try to submit empty form
      await page.click('[data-testid="register-button"]')
      
      // Verify validation errors
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible()
      await expect(page.locator('[data-testid="password-error"]')).toBeVisible()
      
      // Fill invalid email
      await page.fill('[data-testid="email-input"]', 'invalid-email')
      await page.click('[data-testid="register-button"]')
      
      // Verify email validation error
      await expect(page.locator('[data-testid="email-error"]')).toContainText('Invalid email format')
    })

    test('should show error for duplicate email', async ({ page }) => {
      // Register first user
      await page.goto('/auth/register')
      await page.fill('[data-testid="email-input"]', 'duplicate@example.com')
      await page.fill('[data-testid="password-input"]', 'TestPassword123!')
      await page.fill('[data-testid="firstName-input"]', 'First')
      await page.fill('[data-testid="lastName-input"]', 'User')
      await page.click('[data-testid="register-button"]')
      
      // Wait for success
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
      
      // Try to register with same email
      await page.goto('/auth/register')
      await page.fill('[data-testid="email-input"]', 'duplicate@example.com')
      await page.fill('[data-testid="password-input"]', 'TestPassword123!')
      await page.fill('[data-testid="firstName-input"]', 'Second')
      await page.fill('[data-testid="lastName-input"]', 'User')
      await page.click('[data-testid="register-button"]')
      
      // Verify duplicate error
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
      await expect(page.locator('[data-testid="error-message"]')).toContainText('User already exists')
    })
  })

  test.describe('User Login Flow', () => {
    test('should login user successfully', async ({ page }) => {
      // First register a user
      await page.goto('/auth/register')
      await page.fill('[data-testid="email-input"]', 'login-test@example.com')
      await page.fill('[data-testid="password-input"]', 'TestPassword123!')
      await page.fill('[data-testid="firstName-input"]', 'Login')
      await page.fill('[data-testid="lastName-input"]', 'Test')
      await page.click('[data-testid="register-button"]')
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
      
      // Logout
      await page.click('[data-testid="logout-button"]')
      
      // Navigate to login page
      await page.goto('/auth/login')
      
      // Fill login form
      await page.fill('[data-testid="email-input"]', 'login-test@example.com')
      await page.fill('[data-testid="password-input"]', 'TestPassword123!')
      
      // Submit form
      await page.click('[data-testid="login-button"]')
      
      // Wait for success
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Login successful')
      
      // Verify user is logged in
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
    })

    test('should show error for invalid credentials', async ({ page }) => {
      // Navigate to login page
      await page.goto('/auth/login')
      
      // Fill invalid credentials
      await page.fill('[data-testid="email-input"]', 'nonexistent@example.com')
      await page.fill('[data-testid="password-input"]', 'WrongPassword123!')
      
      // Submit form
      await page.click('[data-testid="login-button"]')
      
      // Verify error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials')
    })
  })

  test.describe('User Profile Management', () => {
    test('should display user profile information', async ({ page }) => {
      // Login first
      await page.goto('/auth/register')
      await page.fill('[data-testid="email-input"]', 'profile-test@example.com')
      await page.fill('[data-testid="password-input"]', 'TestPassword123!')
      await page.fill('[data-testid="firstName-input"]', 'Profile')
      await page.fill('[data-testid="lastName-input"]', 'Test')
      await page.click('[data-testid="register-button"]')
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
      
      // Navigate to profile page
      await page.click('[data-testid="profile-link"]')
      
      // Verify profile information
      await expect(page.locator('[data-testid="user-email"]')).toContainText('profile-test@example.com')
      await expect(page.locator('[data-testid="user-firstName"]')).toContainText('Profile')
      await expect(page.locator('[data-testid="user-lastName"]')).toContainText('Test')
    })

    test('should update user profile', async ({ page }) => {
      // Login first
      await page.goto('/auth/register')
      await page.fill('[data-testid="email-input"]', 'update-test@example.com')
      await page.fill('[data-testid="password-input"]', 'TestPassword123!')
      await page.fill('[data-testid="firstName-input"]', 'Original')
      await page.fill('[data-testid="lastName-input"]', 'Name')
      await page.click('[data-testid="register-button"]')
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
      
      // Navigate to profile page
      await page.click('[data-testid="profile-link"]')
      
      // Update profile information
      await page.fill('[data-testid="firstName-input"]', 'Updated')
      await page.fill('[data-testid="lastName-input"]', 'Name')
      await page.click('[data-testid="update-profile-button"]')
      
      // Verify success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Profile updated')
      
      // Verify updated information
      await expect(page.locator('[data-testid="user-firstName"]')).toContainText('Updated')
    })
  })

  test.describe('Password Management', () => {
    test('should change password successfully', async ({ page }) => {
      // Login first
      await page.goto('/auth/register')
      await page.fill('[data-testid="email-input"]', 'password-test@example.com')
      await page.fill('[data-testid="password-input"]', 'OldPassword123!')
      await page.fill('[data-testid="firstName-input"]', 'Password')
      await page.fill('[data-testid="lastName-input"]', 'Test')
      await page.click('[data-testid="register-button"]')
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
      
      // Navigate to change password page
      await page.click('[data-testid="change-password-link"]')
      
      // Fill password change form
      await page.fill('[data-testid="current-password-input"]', 'OldPassword123!')
      await page.fill('[data-testid="new-password-input"]', 'NewPassword123!')
      await page.fill('[data-testid="confirm-password-input"]', 'NewPassword123!')
      
      // Submit form
      await page.click('[data-testid="change-password-button"]')
      
      // Verify success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Password changed successfully')
    })

    test('should handle forgot password flow', async ({ page }) => {
      // Navigate to forgot password page
      await page.goto('/auth/forgot-password')
      
      // Fill email
      await page.fill('[data-testid="email-input"]', 'forgot-test@example.com')
      
      // Submit form
      await page.click('[data-testid="forgot-password-button"]')
      
      // Verify success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Password reset email sent')
    })
  })

  test.describe('Logout Flow', () => {
    test('should logout user successfully', async ({ page }) => {
      // Login first
      await page.goto('/auth/register')
      await page.fill('[data-testid="email-input"]', 'logout-test@example.com')
      await page.fill('[data-testid="password-input"]', 'TestPassword123!')
      await page.fill('[data-testid="firstName-input"]', 'Logout')
      await page.fill('[data-testid="lastName-input"]', 'Test')
      await page.click('[data-testid="register-button"]')
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
      
      // Verify user is logged in
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
      
      // Logout
      await page.click('[data-testid="logout-button"]')
      
      // Verify user is logged out
      await expect(page.locator('[data-testid="login-link"]')).toBeVisible()
      await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible()
    })
  })

  test.describe('Protected Routes', () => {
    test('should redirect to login for protected routes when not authenticated', async ({ page }) => {
      // Try to access protected route without authentication
      await page.goto('/profile')
      
      // Should redirect to login
      await expect(page).toHaveURL(/.*login/)
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible()
    })

    test('should allow access to protected routes when authenticated', async ({ page }) => {
      // Login first
      await page.goto('/auth/register')
      await page.fill('[data-testid="email-input"]', 'protected-test@example.com')
      await page.fill('[data-testid="password-input"]', 'TestPassword123!')
      await page.fill('[data-testid="firstName-input"]', 'Protected')
      await page.fill('[data-testid="lastName-input"]', 'Test')
      await page.click('[data-testid="register-button"]')
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
      
      // Access protected route
      await page.goto('/profile')
      
      // Should be able to access
      await expect(page).toHaveURL(/.*profile/)
      await expect(page.locator('[data-testid="profile-form"]')).toBeVisible()
    })
  })
})

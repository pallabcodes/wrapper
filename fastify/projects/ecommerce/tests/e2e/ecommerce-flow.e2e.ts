/**
 * E2E Tests for Ecommerce Platform
 * Full user journey testing with Playwright
 */

import { test, expect } from '@playwright/test';
import { ProductsPage } from './pages/ProductsPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';

test.describe('Ecommerce User Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test data if needed
    await page.goto('/');
  });

  test('complete purchase flow', async ({ page }) => {
    const productsPage = new ProductsPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    // Navigate to products
    await productsPage.goto();
    await expect(page).toHaveTitle(/Products/);

    // Search for a product
    await productsPage.searchProduct('laptop');
    await expect(productsPage.productCards).toHaveCount(3, { timeout: 5000 });

    // Add product to cart
    await productsPage.addFirstProductToCart();
    await expect(productsPage.cartBadge).toHaveText('1');

    // View cart
    await productsPage.goToCart();
    await expect(cartPage.cartItems).toHaveCount(1);

    // Update quantity
    await cartPage.updateQuantity(0, 2);
    const quantityLocator = await cartPage.getItemQuantity(0);
    await expect(quantityLocator).toHaveText('2');

    // Proceed to checkout
    await cartPage.proceedToCheckout();

    // Fill shipping information
    await checkoutPage.fillShippingInfo({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      address: '123 Main St',
      city: 'New York',
      zipCode: '10001'
    });

    // Select payment method
    await checkoutPage.selectPaymentMethod('credit_card');
    await checkoutPage.fillPaymentInfo({
      cardNumber: '4242424242424242',
      expiryDate: '12/25',
      cvv: '123'
    });

    // Place order
    await checkoutPage.placeOrder();

    // Verify order confirmation
    await expect(page.locator('[data-testid="order-confirmation"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-number"]')).toContainText(/ORD-/);
  });

  test('product filtering and sorting', async ({ page }) => {
    const productsPage = new ProductsPage(page);

    await productsPage.goto();

    // Filter by category
    await productsPage.filterByCategory('Electronics');
    await expect(productsPage.productCards).toHaveCount(5, { timeout: 5000 });

    // Sort by price (low to high)
    await productsPage.sortBy('price_low_high');
    
    // Verify sorting
    const prices = await productsPage.getAllProductPrices();
    for (let i = 1; i < prices.length; i++) {
      const currentPrice = prices[i];
      const previousPrice = prices[i - 1];
      if (currentPrice !== undefined && previousPrice !== undefined) {
        expect(currentPrice).toBeGreaterThanOrEqual(previousPrice);
      }
    }

    // Filter by price range
    await productsPage.filterByPriceRange(50, 200);
    const filteredPrices = await productsPage.getAllProductPrices();
    filteredPrices.forEach((price: number) => {
      expect(price).toBeGreaterThanOrEqual(50);
      expect(price).toBeLessThanOrEqual(200);
    });
  });

  test('user registration and login', async ({ page }) => {
    // Go to registration
    await page.goto('/register');
    
    // Fill registration form
    await page.fill('[data-testid="first-name"]', 'Jane');
    await page.fill('[data-testid="last-name"]', 'Smith');
    await page.fill('[data-testid="email"]', 'jane.smith@example.com');
    await page.fill('[data-testid="password"]', 'SecurePassword123!');
    await page.fill('[data-testid="confirm-password"]', 'SecurePassword123!');
    
    // Submit registration
    await page.click('[data-testid="register-button"]');
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('[data-testid="welcome-message"]')).toContainText('Welcome, Jane');

    // Logout
    await page.click('[data-testid="logout-button"]');
    await expect(page).toHaveURL('/');

    // Login with created account
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'jane.smith@example.com');
    await page.fill('[data-testid="password"]', 'SecurePassword123!');
    await page.click('[data-testid="login-button"]');

    // Verify successful login
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('[data-testid="user-menu"]')).toContainText('Jane Smith');
  });

  test('responsive design across devices', async ({ page }) => {
    const productsPage = new ProductsPage(page);

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await productsPage.goto();

    // Verify mobile navigation
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeHidden();

    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('[data-testid="desktop-navigation"]')).toBeVisible();
  });

  test('accessibility compliance', async ({ page }) => {
    await page.goto('/');

    // Check for proper heading hierarchy
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);

    // Check for alt text on images
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }

    // Check for proper form labels
    const inputs = await page.locator('input[type="text"], input[type="email"], input[type="password"]').all();
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const label = await page.locator(`label[for="${id}"]`).count();
      expect(label).toBeGreaterThan(0);
    }

    // Test keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus').first();
    await expect(focusedElement).toBeVisible();
  });

  test('error handling and recovery', async ({ page }) => {
    // Test 404 page
    await page.goto('/non-existent-page');
    await expect(page.locator('[data-testid="error-404"]')).toBeVisible();
    await expect(page.locator('[data-testid="back-home-button"]')).toBeVisible();

    // Test network error handling
    await page.route('**/api/products', route => route.abort());
    await page.goto('/products');
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();

    // Test retry functionality
    await page.unroute('**/api/products');
    await page.click('[data-testid="retry-button"]');
    await expect(page.locator('[data-testid="product-grid"]')).toBeVisible();
  });

  test('performance metrics', async ({ page }) => {
    // Navigate to products page and measure performance
    const startTime = Date.now();
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Assert reasonable load time (under 3 seconds)
    expect(loadTime).toBeLessThan(3000);

    // Check Core Web Vitals
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            resolve(lastEntry.startTime);
          } else {
            resolve(0);
          }
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      });
    });

    expect(lcp).toBeLessThan(2500); // LCP should be under 2.5 seconds
  });

  test('search functionality', async ({ page }) => {
    const productsPage = new ProductsPage(page);

    await productsPage.goto();

    // Test basic search
    await productsPage.searchProduct('laptop');
    await expect(productsPage.productCards).toHaveCount(3, { timeout: 5000 });

    // Test search with no results
    await productsPage.searchProduct('nonexistentproduct');
    await expect(page.locator('[data-testid="no-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="no-results"]')).toContainText('No products found');

    // Test search autocomplete
    await page.fill('[data-testid="search-input"]', 'lap');
    await expect(page.locator('[data-testid="search-suggestions"]')).toBeVisible();
    await expect(page.locator('[data-testid="search-suggestion"]')).toHaveCount(3);
  });
});

test.describe('Admin Panel Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/admin/login');
    await page.fill('[data-testid="email"]', 'admin@example.com');
    await page.fill('[data-testid="password"]', 'AdminPassword123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test('product management', async ({ page }) => {
    // Navigate to products management
    await page.click('[data-testid="products-menu"]');
    await expect(page).toHaveURL(/\/admin\/products/);

    // Create new product
    await page.click('[data-testid="add-product-button"]');
    await page.fill('[data-testid="product-name"]', 'Test Product');
    await page.fill('[data-testid="product-price"]', '99.99');
    await page.fill('[data-testid="product-sku"]', 'TEST001');
    await page.selectOption('[data-testid="product-category"]', 'Electronics');
    await page.fill('[data-testid="product-inventory"]', '10');
    await page.fill('[data-testid="product-description"]', 'A test product');

    await page.click('[data-testid="save-product-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // Verify product appears in list
    await expect(page.locator('[data-testid="product-row"]')).toContainText('Test Product');

    // Edit product
    await page.click('[data-testid="edit-product-button"]');
    await page.fill('[data-testid="product-name"]', 'Updated Test Product');
    await page.click('[data-testid="save-product-button"]');
    await expect(page.locator('[data-testid="product-row"]')).toContainText('Updated Test Product');

    // Delete product
    await page.click('[data-testid="delete-product-button"]');
    await page.click('[data-testid="confirm-delete-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Product deleted');
  });

  test('order management', async ({ page }) => {
    await page.click('[data-testid="orders-menu"]');
    await expect(page).toHaveURL(/\/admin\/orders/);

    // Filter orders by status
    await page.selectOption('[data-testid="status-filter"]', 'pending');
    await expect(page.locator('[data-testid="order-row"]')).toHaveCount(3);

    // View order details
    await page.click('[data-testid="view-order-button"]');
    await expect(page.locator('[data-testid="order-details"]')).toBeVisible();

    // Update order status
    await page.selectOption('[data-testid="order-status"]', 'processing');
    await page.click('[data-testid="update-status-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });
});

/**
 * Products Page Object Model for E2E Tests
 * Provides methods to interact with the products page
 */

import { expect } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';

export class ProductsPage {
  readonly page: Page;
  readonly productCards: Locator;
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;
  readonly sortSelect: Locator;
  readonly priceRangeMin: Locator;
  readonly priceRangeMax: Locator;
  readonly cartBadge: Locator;
  readonly cartButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productCards = page.locator('[data-testid="product-card"]');
    this.searchInput = page.locator('[data-testid="search-input"]');
    this.categoryFilter = page.locator('[data-testid="category-filter"]');
    this.sortSelect = page.locator('[data-testid="sort-select"]');
    this.priceRangeMin = page.locator('[data-testid="price-range-min"]');
    this.priceRangeMax = page.locator('[data-testid="price-range-max"]');
    this.cartBadge = page.locator('[data-testid="cart-badge"]');
    this.cartButton = page.locator('[data-testid="cart-button"]');
  }

  async goto() {
    await this.page.goto('/products');
    await this.page.waitForLoadState('networkidle');
  }

  async searchProduct(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category);
    await this.page.waitForLoadState('networkidle');
  }

  async sortBy(option: string) {
    await this.sortSelect.selectOption(option);
    await this.page.waitForLoadState('networkidle');
  }

  async filterByPriceRange(min: number, max: number) {
    await this.priceRangeMin.fill(min.toString());
    await this.priceRangeMax.fill(max.toString());
    await this.page.keyboard.press('Enter');
    await this.page.waitForLoadState('networkidle');
  }

  async addFirstProductToCart() {
    const firstProduct = this.productCards.first();
    const addToCartButton = firstProduct.locator('[data-testid="add-to-cart-button"]');
    await addToCartButton.click();
    
    // Wait for cart update
    await this.page.waitForTimeout(1000);
  }

  async addProductToCartByIndex(index: number) {
    const product = this.productCards.nth(index);
    const addToCartButton = product.locator('[data-testid="add-to-cart-button"]');
    await addToCartButton.click();
    await this.page.waitForTimeout(1000);
  }

  async getProductPrice(index: number): Promise<number> {
    const product = this.productCards.nth(index);
    const priceElement = product.locator('[data-testid="product-price"]');
    const priceText = await priceElement.textContent();
    
    if (!priceText) return 0;
    
    // Extract numeric value from price text (e.g., "$99.99" -> 99.99)
    const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
    return price;
  }

  async getAllProductPrices(): Promise<number[]> {
    const count = await this.productCards.count();
    const prices: number[] = [];
    
    for (let i = 0; i < count; i++) {
      const price = await this.getProductPrice(i);
      prices.push(price);
    }
    
    return prices;
  }

  async goToCart() {
    await this.cartButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async getProductName(index: number): Promise<string> {
    const product = this.productCards.nth(index);
    const nameElement = product.locator('[data-testid="product-name"]');
    return await nameElement.textContent() || '';
  }

  async viewProductDetails(index: number) {
    const product = this.productCards.nth(index);
    const viewButton = product.locator('[data-testid="view-product-button"]');
    await viewButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async isProductInStock(index: number): Promise<boolean> {
    const product = this.productCards.nth(index);
    const stockStatus = product.locator('[data-testid="stock-status"]');
    const statusText = await stockStatus.textContent();
    return statusText?.includes('In Stock') || false;
  }

  async getProductCategory(index: number): Promise<string> {
    const product = this.productCards.nth(index);
    const categoryElement = product.locator('[data-testid="product-category"]');
    return await categoryElement.textContent() || '';
  }

  async waitForProductsToLoad() {
    await expect(this.productCards.first()).toBeVisible({ timeout: 10000 });
  }

  async clearFilters() {
    await this.page.click('[data-testid="clear-filters-button"]');
    await this.page.waitForLoadState('networkidle');
  }
}

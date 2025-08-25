/**
 * Cart Page Object Model for E2E Tests
 * Provides methods to interact with the shopping cart
 */

import { expect } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';

export class CartPage {
  readonly page: Page;
  readonly cartItems: Locator;
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;
  readonly cartTotal: Locator;
  readonly cartSubtotal: Locator;
  readonly cartTax: Locator;
  readonly cartShipping: Locator;
  readonly emptyCartMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartItems = page.locator('[data-testid="cart-item"]');
    this.checkoutButton = page.locator('[data-testid="checkout-button"]');
    this.continueShoppingButton = page.locator('[data-testid="continue-shopping-button"]');
    this.cartTotal = page.locator('[data-testid="cart-total"]');
    this.cartSubtotal = page.locator('[data-testid="cart-subtotal"]');
    this.cartTax = page.locator('[data-testid="cart-tax"]');
    this.cartShipping = page.locator('[data-testid="cart-shipping"]');
    this.emptyCartMessage = page.locator('[data-testid="empty-cart-message"]');
  }

  async goto() {
    await this.page.goto('/cart');
    await this.page.waitForLoadState('networkidle');
  }

  async updateQuantity(itemIndex: number, quantity: number) {
    const cartItem = this.cartItems.nth(itemIndex);
    const quantityInput = cartItem.locator('[data-testid="quantity-input"]');
    
    await quantityInput.clear();
    await quantityInput.fill(quantity.toString());
    await quantityInput.press('Enter');
    
    // Wait for cart to update
    await this.page.waitForTimeout(1000);
  }

  async increaseQuantity(itemIndex: number) {
    const cartItem = this.cartItems.nth(itemIndex);
    const increaseButton = cartItem.locator('[data-testid="increase-quantity-button"]');
    await increaseButton.click();
    await this.page.waitForTimeout(1000);
  }

  async decreaseQuantity(itemIndex: number) {
    const cartItem = this.cartItems.nth(itemIndex);
    const decreaseButton = cartItem.locator('[data-testid="decrease-quantity-button"]');
    await decreaseButton.click();
    await this.page.waitForTimeout(1000);
  }

  async removeItem(itemIndex: number) {
    const cartItem = this.cartItems.nth(itemIndex);
    const removeButton = cartItem.locator('[data-testid="remove-item-button"]');
    await removeButton.click();
    
    // Confirm removal if confirmation dialog appears
    const confirmButton = this.page.locator('[data-testid="confirm-remove-button"]');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
    
    await this.page.waitForTimeout(1000);
  }

  async getItemQuantity(itemIndex: number): Promise<Locator> {
    const cartItem = this.cartItems.nth(itemIndex);
    return cartItem.locator('[data-testid="item-quantity"]');
  }

  async getItemPrice(itemIndex: number): Promise<number> {
    const cartItem = this.cartItems.nth(itemIndex);
    const priceElement = cartItem.locator('[data-testid="item-price"]');
    const priceText = await priceElement.textContent();
    
    if (!priceText) return 0;
    
    // Extract numeric value from price text
    const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
    return price;
  }

  async getItemName(itemIndex: number): Promise<string> {
    const cartItem = this.cartItems.nth(itemIndex);
    const nameElement = cartItem.locator('[data-testid="item-name"]');
    return await nameElement.textContent() || '';
  }

  async getTotalPrice(): Promise<number> {
    const totalText = await this.cartTotal.textContent();
    if (!totalText) return 0;
    
    const total = parseFloat(totalText.replace(/[^0-9.]/g, ''));
    return total;
  }

  async getSubtotal(): Promise<number> {
    const subtotalText = await this.cartSubtotal.textContent();
    if (!subtotalText) return 0;
    
    const subtotal = parseFloat(subtotalText.replace(/[^0-9.]/g, ''));
    return subtotal;
  }

  async proceedToCheckout() {
    await this.checkoutButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async continueShopping() {
    await this.continueShoppingButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async clearCart() {
    const itemCount = await this.cartItems.count();
    
    // Remove all items
    for (let i = itemCount - 1; i >= 0; i--) {
      await this.removeItem(i);
    }
    
    // Verify cart is empty
    await expect(this.emptyCartMessage).toBeVisible();
  }

  async applyCoupon(couponCode: string) {
    const couponInput = this.page.locator('[data-testid="coupon-input"]');
    const applyCouponButton = this.page.locator('[data-testid="apply-coupon-button"]');
    
    await couponInput.fill(couponCode);
    await applyCouponButton.click();
    await this.page.waitForTimeout(2000);
  }

  async isItemInCart(productName: string): Promise<boolean> {
    const itemCount = await this.cartItems.count();
    
    for (let i = 0; i < itemCount; i++) {
      const itemName = await this.getItemName(i);
      if (itemName.includes(productName)) {
        return true;
      }
    }
    
    return false;
  }

  async getCartItemCount(): Promise<number> {
    return await this.cartItems.count();
  }

  async saveForLater(itemIndex: number) {
    const cartItem = this.cartItems.nth(itemIndex);
    const saveButton = cartItem.locator('[data-testid="save-for-later-button"]');
    await saveButton.click();
    await this.page.waitForTimeout(1000);
  }

  async moveToWishlist(itemIndex: number) {
    const cartItem = this.cartItems.nth(itemIndex);
    const wishlistButton = cartItem.locator('[data-testid="move-to-wishlist-button"]');
    await wishlistButton.click();
    await this.page.waitForTimeout(1000);
  }

  async estimateShipping(zipCode: string) {
    const zipInput = this.page.locator('[data-testid="shipping-zip-input"]');
    const estimateButton = this.page.locator('[data-testid="estimate-shipping-button"]');
    
    await zipInput.fill(zipCode);
    await estimateButton.click();
    await this.page.waitForTimeout(2000);
  }

  async waitForCartToLoad() {
    // Wait for either cart items or empty cart message to be visible
    await Promise.race([
      expect(this.cartItems.first()).toBeVisible({ timeout: 10000 }),
      expect(this.emptyCartMessage).toBeVisible({ timeout: 10000 })
    ]);
  }
}

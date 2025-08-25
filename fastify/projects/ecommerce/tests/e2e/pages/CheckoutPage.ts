/**
 * Checkout Page Object Model for E2E Tests
 * Provides methods to interact with the checkout process
 */

import { expect } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';

export interface ShippingInfo {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  zipCode: string;
  state?: string;
  country?: string;
  phone?: string;
}

export interface PaymentInfo {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardName?: string;
}

export class CheckoutPage {
  readonly page: Page;
  readonly shippingForm: Locator;
  readonly paymentForm: Locator;
  readonly orderSummary: Locator;
  readonly placeOrderButton: Locator;
  readonly backToCartButton: Locator;
  readonly shippingMethodOptions: Locator;
  readonly paymentMethodOptions: Locator;

  // Shipping form fields
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly addressInput: Locator;
  readonly cityInput: Locator;
  readonly zipCodeInput: Locator;
  readonly stateSelect: Locator;
  readonly countrySelect: Locator;
  readonly phoneInput: Locator;

  // Payment form fields
  readonly cardNumberInput: Locator;
  readonly expiryDateInput: Locator;
  readonly cvvInput: Locator;
  readonly cardNameInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.shippingForm = page.locator('[data-testid="shipping-form"]');
    this.paymentForm = page.locator('[data-testid="payment-form"]');
    this.orderSummary = page.locator('[data-testid="order-summary"]');
    this.placeOrderButton = page.locator('[data-testid="place-order-button"]');
    this.backToCartButton = page.locator('[data-testid="back-to-cart-button"]');
    this.shippingMethodOptions = page.locator('[data-testid="shipping-method-option"]');
    this.paymentMethodOptions = page.locator('[data-testid="payment-method-option"]');

    // Shipping form fields
    this.firstNameInput = page.locator('[data-testid="first-name"]');
    this.lastNameInput = page.locator('[data-testid="last-name"]');
    this.emailInput = page.locator('[data-testid="email"]');
    this.addressInput = page.locator('[data-testid="address"]');
    this.cityInput = page.locator('[data-testid="city"]');
    this.zipCodeInput = page.locator('[data-testid="zip-code"]');
    this.stateSelect = page.locator('[data-testid="state"]');
    this.countrySelect = page.locator('[data-testid="country"]');
    this.phoneInput = page.locator('[data-testid="phone"]');

    // Payment form fields
    this.cardNumberInput = page.locator('[data-testid="card-number"]');
    this.expiryDateInput = page.locator('[data-testid="expiry-date"]');
    this.cvvInput = page.locator('[data-testid="cvv"]');
    this.cardNameInput = page.locator('[data-testid="card-name"]');
  }

  async goto() {
    await this.page.goto('/checkout');
    await this.page.waitForLoadState('networkidle');
  }

  async fillShippingInfo(info: ShippingInfo) {
    await this.firstNameInput.fill(info.firstName);
    await this.lastNameInput.fill(info.lastName);
    await this.emailInput.fill(info.email);
    await this.addressInput.fill(info.address);
    await this.cityInput.fill(info.city);
    await this.zipCodeInput.fill(info.zipCode);

    if (info.state) {
      await this.stateSelect.selectOption(info.state);
    }

    if (info.country) {
      await this.countrySelect.selectOption(info.country);
    }

    if (info.phone) {
      await this.phoneInput.fill(info.phone);
    }
  }

  async selectShippingMethod(method: string) {
    const shippingOption = this.page.locator(`[data-testid="shipping-method-${method}"]`);
    await shippingOption.click();
    await this.page.waitForTimeout(1000);
  }

  async selectPaymentMethod(method: string) {
    const paymentOption = this.page.locator(`[data-testid="payment-method-${method}"]`);
    await paymentOption.click();
    await this.page.waitForTimeout(1000);
  }

  async fillPaymentInfo(info: PaymentInfo) {
    await this.cardNumberInput.fill(info.cardNumber);
    await this.expiryDateInput.fill(info.expiryDate);
    await this.cvvInput.fill(info.cvv);

    if (info.cardName) {
      await this.cardNameInput.fill(info.cardName);
    }
  }

  async applyCoupon(couponCode: string) {
    const couponInput = this.page.locator('[data-testid="checkout-coupon-input"]');
    const applyCouponButton = this.page.locator('[data-testid="apply-checkout-coupon-button"]');

    await couponInput.fill(couponCode);
    await applyCouponButton.click();
    await this.page.waitForTimeout(2000);
  }

  async placeOrder() {
    await this.placeOrderButton.click();
    
    // Wait for order processing
    await this.page.waitForLoadState('networkidle');
    
    // Wait for either success or error message
    await Promise.race([
      expect(this.page.locator('[data-testid="order-confirmation"]')).toBeVisible({ timeout: 30000 }),
      expect(this.page.locator('[data-testid="order-error"]')).toBeVisible({ timeout: 30000 })
    ]);
  }

  async backToCart() {
    await this.backToCartButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async getOrderTotal(): Promise<number> {
    const totalElement = this.page.locator('[data-testid="checkout-total"]');
    const totalText = await totalElement.textContent();
    
    if (!totalText) return 0;
    
    const total = parseFloat(totalText.replace(/[^0-9.]/g, ''));
    return total;
  }

  async getShippingCost(): Promise<number> {
    const shippingElement = this.page.locator('[data-testid="checkout-shipping-cost"]');
    const shippingText = await shippingElement.textContent();
    
    if (!shippingText) return 0;
    
    const shipping = parseFloat(shippingText.replace(/[^0-9.]/g, ''));
    return shipping;
  }

  async getTaxAmount(): Promise<number> {
    const taxElement = this.page.locator('[data-testid="checkout-tax"]');
    const taxText = await taxElement.textContent();
    
    if (!taxText) return 0;
    
    const tax = parseFloat(taxText.replace(/[^0-9.]/g, ''));
    return tax;
  }

  async validateShippingForm(): Promise<boolean> {
    // Check if all required fields are filled
    const firstName = await this.firstNameInput.inputValue();
    const lastName = await this.lastNameInput.inputValue();
    const email = await this.emailInput.inputValue();
    const address = await this.addressInput.inputValue();
    const city = await this.cityInput.inputValue();
    const zipCode = await this.zipCodeInput.inputValue();

    return !!(firstName && lastName && email && address && city && zipCode);
  }

  async validatePaymentForm(): Promise<boolean> {
    // Check if all required payment fields are filled
    const cardNumber = await this.cardNumberInput.inputValue();
    const expiryDate = await this.expiryDateInput.inputValue();
    const cvv = await this.cvvInput.inputValue();

    return !!(cardNumber && expiryDate && cvv);
  }

  async proceedToPayment() {
    const continueButton = this.page.locator('[data-testid="continue-to-payment-button"]');
    await continueButton.click();
    await this.page.waitForTimeout(1000);
  }

  async proceedToReview() {
    const reviewButton = this.page.locator('[data-testid="continue-to-review-button"]');
    await reviewButton.click();
    await this.page.waitForTimeout(1000);
  }

  async editShippingInfo() {
    const editButton = this.page.locator('[data-testid="edit-shipping-button"]');
    await editButton.click();
    await this.page.waitForTimeout(1000);
  }

  async editPaymentInfo() {
    const editButton = this.page.locator('[data-testid="edit-payment-button"]');
    await editButton.click();
    await this.page.waitForTimeout(1000);
  }

  async saveShippingAddress() {
    const saveCheckbox = this.page.locator('[data-testid="save-shipping-address"]');
    await saveCheckbox.check();
  }

  async useAsDefaultAddress() {
    const defaultCheckbox = this.page.locator('[data-testid="use-as-default-address"]');
    await defaultCheckbox.check();
  }

  async selectSavedAddress(addressId: string) {
    const savedAddress = this.page.locator(`[data-testid="saved-address-${addressId}"]`);
    await savedAddress.click();
    await this.page.waitForTimeout(1000);
  }

  async addNewAddress() {
    const addButton = this.page.locator('[data-testid="add-new-address-button"]');
    await addButton.click();
    await this.page.waitForTimeout(1000);
  }

  async getOrderNumber(): Promise<string> {
    const orderNumberElement = this.page.locator('[data-testid="order-number"]');
    return await orderNumberElement.textContent() || '';
  }

  async downloadInvoice() {
    const downloadButton = this.page.locator('[data-testid="download-invoice-button"]');
    
    // Start waiting for download before clicking
    const downloadPromise = this.page.waitForEvent('download');
    await downloadButton.click();
    const download = await downloadPromise;
    
    return download;
  }

  async continueToTrackOrder() {
    const trackButton = this.page.locator('[data-testid="track-order-button"]');
    await trackButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async waitForCheckoutToLoad() {
    await expect(this.shippingForm).toBeVisible({ timeout: 10000 });
  }

  async isPlaceOrderEnabled(): Promise<boolean> {
    return await this.placeOrderButton.isEnabled();
  }

  async getPaymentMethodsCount(): Promise<number> {
    return await this.paymentMethodOptions.count();
  }

  async getShippingMethodsCount(): Promise<number> {
    return await this.shippingMethodOptions.count();
  }
}

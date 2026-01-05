/**
 * Domain Value Object: Money
 *
 * Represents monetary values with currency support
 * Immutable and validated
 */
// Stripe-supported currencies (subset of major currencies)
const STRIPE_SUPPORTED_CURRENCIES = new Set([
  'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'SEK', 'NOK', 'DKK',
  'NZD', 'MXN', 'SGD', 'HKD', 'KRW', 'BRL', 'ZAR', 'INR'
]);

// Minimum payment amounts by currency (in cents) - Stripe requirements
const STRIPE_MINIMUM_AMOUNTS: Record<string, number> = {
  'USD': 50,    // $0.50
  'EUR': 50,    // €0.50
  'GBP': 30,    // £0.30
  'CAD': 50,    // $0.50 CAD
  'AUD': 50,    // $0.50 AUD
  'JPY': 50,    // ¥50
  'CHF': 50,    // CHF 0.50
  'SEK': 300,   // SEK 3.00
  'NOK': 300,   // NOK 3.00
  'DKK': 250,   // DKK 2.50
  'NZD': 50,    // $0.50 NZD
  'MXN': 1000,  // MXN 10.00
  'SGD': 50,    // $0.50 SGD
  'HKD': 400,   // HKD 4.00
  'KRW': 100,   // ₩100
  'BRL': 50,    // R$ 0.50
  'ZAR': 100,   // ZAR 1.00
  'INR': 50,    // ₹0.50
};

export class Money {
  private constructor(
    private readonly amount: number, // Amount in cents (for precision)
    private readonly currency: string
  ) {}

  /**
   * Validate if currency is supported by Stripe
   */
  private static validateCurrency(currency: string): void {
    const upperCurrency = currency.toUpperCase();
    if (!STRIPE_SUPPORTED_CURRENCIES.has(upperCurrency)) {
      throw new Error(`Currency ${upperCurrency} is not supported by Stripe`);
    }
  }

  /**
   * Validate if amount meets Stripe's minimum requirements
   */
  private static validateMinimumAmount(cents: number, currency: string): void {
    const upperCurrency = currency.toUpperCase();
    const minimum = STRIPE_MINIMUM_AMOUNTS[upperCurrency];
    if (minimum && cents < minimum) {
      const minAmount = minimum / 100;
      throw new Error(`Amount must be at least ${minAmount} ${upperCurrency} (Stripe minimum requirement)`);
    }
  }

  /**
   * Create Money from dollar amount (e.g., 10.99)
   * Handles floating point precision issues safely
   */
  static fromDollars(amount: number, currency: string = 'USD'): Money {
    if (amount < 0) {
      throw new Error('Amount cannot be negative');
    }

    if (!Number.isFinite(amount)) {
      throw new Error('Amount must be a finite number');
    }

    if (!currency || currency.length !== 3) {
      throw new Error('Currency must be a valid 3-letter code');
    }

    // Validate Stripe-supported currency
    Money.validateCurrency(currency);

    // CRITICAL: Handle floating point precision issues
    // Use Number.EPSILON and proper rounding to avoid precision errors
    const cents = Math.round((amount + Number.EPSILON) * 100);

    // Validate minimum amount requirement
    Money.validateMinimumAmount(cents, currency);

    return new Money(cents, currency.toUpperCase());
  }

  /**
   * Create Money from cents (e.g., 1099 for $10.99)
   */
  static fromCents(cents: number, currency: string = 'USD'): Money {
    if (cents < 0) {
      throw new Error('Amount cannot be negative');
    }

    if (!currency || currency.length !== 3) {
      throw new Error('Currency must be a valid 3-letter code');
    }

    // Validate Stripe-supported currency
    Money.validateCurrency(currency);

    // Validate minimum amount requirement
    Money.validateMinimumAmount(cents, currency);

    return new Money(cents, currency.toUpperCase());
  }

  /**
   * Legacy method for backward compatibility - prefer fromDollars()
   * @deprecated Use fromDollars() instead
   */
  static create(amount: number, currency: string = 'USD'): Money {
    return Money.fromDollars(amount, currency);
  }

  getAmount(): number {
    return this.amount / 100; // Return dollars
  }

  getAmountInCents(): number {
    return this.amount; // Return cents
  }

  getCurrency(): string {
    return this.currency;
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add money with different currencies');
    }

    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot subtract money with different currencies');
    }

    const result = this.amount - other.amount;
    if (result < 0) {
      throw new Error('Cannot subtract to negative amount');
    }

    return new Money(result, this.currency);
  }

  multiply(factor: number): Money {
    if (factor < 0) {
      throw new Error('Multiplication factor cannot be negative');
    }

    return new Money(Math.round(this.amount * factor), this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  isGreaterThan(other: Money): boolean {
    if (this.currency !== other.currency) {
      throw new Error('Cannot compare money with different currencies');
    }
    return this.amount > other.amount;
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  toString(): string {
    return `${(this.amount / 100).toFixed(2)} ${this.currency}`;
  }

  /**
   * JSON representation for API responses (returns dollars)
   */
  toJSON(): { amount: number; currency: string } {
    return {
      amount: this.getAmount(),
      currency: this.currency
    };
  }

  /**
   * Stripe representation (returns cents for API calls)
   */
  toStripeFormat(): { amount: number; currency: string } {
    return {
      amount: this.getAmountInCents(),
      currency: this.currency.toLowerCase()
    };
  }
}

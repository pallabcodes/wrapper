import { Money } from '../value-objects/money.vo';
import { DomainException } from '../exceptions/domain.exception';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded'
}

/**
 * Domain Entity: Subscription
 *
 * Manages recurring payment subscriptions with Stripe integration
 */
export class Subscription {
  private constructor(
    private readonly id: string,
    private readonly userId: string,
    private status: SubscriptionStatus,
    private interval: SubscriptionInterval,
    private readonly amount: Money,
    private readonly description: string,
    private currentPeriodStart: Date,
    private currentPeriodEnd: Date,
    private cancelAtPeriodEnd: boolean,
    private canceledAt?: Date,
    private stripeSubscriptionId?: string,
    private stripeCustomerId?: string,
    private stripePriceId?: string,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date(),
    private readonly version: number = 1
  ) { }

  static create(
    id: string,
    userId: string,
    interval: SubscriptionInterval,
    amount: Money,
    description: string
  ): Subscription {
    const now = new Date();
    const periodEnd = Subscription.calculatePeriodEnd(now, interval);

    return new Subscription(
      id,
      userId,
      SubscriptionStatus.INCOMPLETE,
      interval,
      amount,
      description,
      now,
      periodEnd,
      false,
      undefined,
      undefined,
      undefined,
      undefined,
      now,
      now,
      1
    );
  }

  static fromPersistence(data: {
    id: string;
    userId: string;
    status: SubscriptionStatus;
    interval: SubscriptionInterval;
    amount: number;
    currency: string;
    description: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    canceledAt?: Date;
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
    stripePriceId?: string;
    createdAt: Date;
    updatedAt: Date;
    version: number;
  }): Subscription {
    const amount = Money.fromCents(data.amount, data.currency);

    return new Subscription(
      data.id,
      data.userId,
      data.status,
      data.interval,
      amount,
      data.description,
      data.currentPeriodStart,
      data.currentPeriodEnd,
      data.cancelAtPeriodEnd,
      data.canceledAt,
      data.stripeSubscriptionId,
      data.stripeCustomerId,
      data.stripePriceId,
      data.createdAt,
      data.updatedAt,
      data.version
    );
  }

  // Getters
  getId(): string { return this.id; }
  getUserId(): string { return this.userId; }
  getStatus(): SubscriptionStatus { return this.status; }
  getInterval(): SubscriptionInterval { return this.interval; }
  getAmount(): Money { return this.amount; }
  getDescription(): string { return this.description; }
  getCurrentPeriodStart(): Date { return this.currentPeriodStart; }
  getCurrentPeriodEnd(): Date { return this.currentPeriodEnd; }
  getCancelAtPeriodEnd(): boolean { return this.cancelAtPeriodEnd; }
  getCanceledAt(): Date | undefined { return this.canceledAt; }
  getStripeSubscriptionId(): string | undefined { return this.stripeSubscriptionId; }
  getStripeCustomerId(): string | undefined { return this.stripeCustomerId; }
  getStripePriceId(): string | undefined { return this.stripePriceId; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }
  getVersion(): number { return this.version; }

  // Business Rules
  isActive(): boolean {
    return this.status === SubscriptionStatus.ACTIVE ||
      this.status === SubscriptionStatus.TRIALING;
  }

  isCanceled(): boolean {
    return this.status === SubscriptionStatus.CANCELED;
  }

  isPastDue(): boolean {
    return this.status === SubscriptionStatus.PAST_DUE;
  }

  canBeCanceled(): boolean {
    return this.isActive() && !this.cancelAtPeriodEnd;
  }

  canBeReactivated(): boolean {
    return this.status === SubscriptionStatus.CANCELED ||
      this.status === SubscriptionStatus.PAST_DUE;
  }

  // Business Methods
  activate(stripeSubscriptionId: string, stripeCustomerId: string, stripePriceId: string): void {
    this.status = SubscriptionStatus.ACTIVE;
    this.stripeSubscriptionId = stripeSubscriptionId;
    this.stripeCustomerId = stripeCustomerId;
    this.stripePriceId = stripePriceId;
    this.updatedAt = new Date();
  }

  markAsIncomplete(): void {
    this.status = SubscriptionStatus.INCOMPLETE;
    this.updatedAt = new Date();
  }

  markAsIncompleteExpired(): void {
    this.status = SubscriptionStatus.INCOMPLETE_EXPIRED;
    this.updatedAt = new Date();
  }

  markAsPastDue(): void {
    this.status = SubscriptionStatus.PAST_DUE;
    this.updatedAt = new Date();
  }

  scheduleCancellation(): void {
    if (!this.canBeCanceled()) {
      throw DomainException.subscriptionCannotBeCanceled();
    }
    this.cancelAtPeriodEnd = true;
    this.updatedAt = new Date();
  }

  cancelImmediately(): void {
    if (!this.canBeCanceled()) {
      throw DomainException.subscriptionCannotBeCanceled();
    }
    this.status = SubscriptionStatus.CANCELED;
    this.canceledAt = new Date();
    this.updatedAt = new Date();
  }

  reactivate(): void {
    if (!this.canBeReactivated()) {
      throw DomainException.subscriptionCannotBeReactivated();
    }
    this.status = SubscriptionStatus.ACTIVE;
    this.cancelAtPeriodEnd = false;
    this.canceledAt = undefined;
    this.updatedAt = new Date();
  }

  updatePeriod(newStart: Date, newEnd: Date): void {
    this.currentPeriodStart = newStart;
    this.currentPeriodEnd = newEnd;
    this.updatedAt = new Date();
  }

  pause(): void {
    if (!this.isActive()) {
      throw DomainException.subscriptionCannotBePaused();
    }
    this.status = SubscriptionStatus.PAUSED;
    this.updatedAt = new Date();
  }

  resume(): void {
    if (this.status !== SubscriptionStatus.PAUSED) {
      throw DomainException.subscriptionCannotBeResumed();
    }
    this.status = SubscriptionStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  // Helper Methods
  private static calculatePeriodEnd(startDate: Date, interval: SubscriptionInterval): Date {
    const endDate = new Date(startDate);

    switch (interval) {
      case SubscriptionInterval.MONTH:
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case SubscriptionInterval.QUARTER:
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case SubscriptionInterval.YEAR:
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }

    return endDate;
  }

  getDaysUntilRenewal(): number {
    const now = new Date();
    const diffTime = this.currentPeriodEnd.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isExpiringSoon(daysThreshold: number = 7): boolean {
    return this.getDaysUntilRenewal() <= daysThreshold;
  }

  equals(other: Subscription): boolean {
    return this.id === other.id && this.version === other.version;
  }
}

export enum PaymentMethod {
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  DIGITAL_WALLET = 'digital_wallet'
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  UNPAID = 'unpaid',
  PAUSED = 'paused',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  TRIALING = 'trialing'
}

export enum SubscriptionInterval {
  MONTH = 'month',
  QUARTER = 'quarter', // 3 months
  YEAR = 'year'
}

/**
 * Domain Entity: Payment
 *
 * Core business object representing a payment transaction
 * Contains all business rules and behaviors for payment processing
 */
export class Payment {
  private constructor(
    private readonly id: string,
    private readonly userId: string,
    private amount: Money,
    private status: PaymentStatus,
    private method: PaymentMethod,
    private readonly description: string,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private completedAt?: Date,
    private refundedAmount?: Money,
    private stripePaymentIntentId?: string,
    private stripeRefundId?: string,
    private failureReason?: string,
    private readonly version: number = 1
  ) { }

  static create(
    id: string,
    userId: string,
    amount: Money,
    method: PaymentMethod,
    description: string
  ): Payment {
    const now = new Date();
    return new Payment(
      id,
      userId,
      amount,
      PaymentStatus.PENDING,
      method,
      description,
      now,
      now,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      1
    );
  }

  static fromPersistence(data: {
    id: string;
    userId: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    method: PaymentMethod;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    refundedAmount?: number;
    refundedCurrency?: string;
    stripePaymentIntentId?: string;
    stripeRefundId?: string;
    failureReason?: string;
    version: number;
  }): Payment {
    const amount = Money.fromCents(data.amount, data.currency);
    const refundedAmount = data.refundedAmount && data.refundedCurrency
      ? Money.fromCents(data.refundedAmount, data.refundedCurrency)
      : undefined;

    return new Payment(
      data.id,
      data.userId,
      amount,
      data.status,
      data.method,
      data.description,
      data.createdAt,
      data.updatedAt,
      data.completedAt,
      refundedAmount,
      data.stripePaymentIntentId,
      data.stripeRefundId,
      data.failureReason,
      data.version
    );
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getUserId(): string {
    return this.userId;
  }

  getAmount(): Money {
    return this.amount;
  }

  getStatus(): PaymentStatus {
    return this.status;
  }

  getMethod(): PaymentMethod {
    return this.method;
  }

  getDescription(): string {
    return this.description;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getCompletedAt(): Date | undefined {
    return this.completedAt;
  }

  getRefundedAmount(): Money | undefined {
    return this.refundedAmount;
  }

  getStripePaymentIntentId(): string | undefined {
    return this.stripePaymentIntentId;
  }

  getStripeRefundId(): string | undefined {
    return this.stripeRefundId;
  }

  getFailureReason(): string | undefined {
    return this.failureReason;
  }

  getVersion(): number {
    return this.version;
  }

  // Business Methods (continued)
  setStripePaymentIntentId(paymentIntentId: string): void {
    if (this.stripePaymentIntentId) {
      // Idempotent: don't overwrite existing ID
      return;
    }
    this.stripePaymentIntentId = paymentIntentId;
    this.updatedAt = new Date();
  }

  // Business Rules
  canBeProcessed(): boolean {
    return this.status === PaymentStatus.PENDING;
  }

  canBeRefunded(): boolean {
    return this.status === PaymentStatus.COMPLETED ||
      this.status === PaymentStatus.PARTIALLY_REFUNDED;
  }

  canBeCancelled(): boolean {
    return this.status === PaymentStatus.PENDING ||
      this.status === PaymentStatus.PROCESSING;
  }

  isCompleted(): boolean {
    return this.status === PaymentStatus.COMPLETED;
  }

  isFailed(): boolean {
    return this.status === PaymentStatus.FAILED;
  }

  isRefunded(): boolean {
    return this.status === PaymentStatus.REFUNDED;
  }

  isPartiallyRefunded(): boolean {
    return this.status === PaymentStatus.PARTIALLY_REFUNDED;
  }

  getRemainingRefundableAmount(): Money {
    if (!this.isCompleted() && !this.isPartiallyRefunded()) {
      return Money.fromCents(0, this.amount.getCurrency());
    }

    const refunded = this.refundedAmount || Money.fromCents(0, this.amount.getCurrency());
    return this.amount.subtract(refunded);
  }

  // Business Methods
  markAsProcessing(): void {
    if (!this.canBeProcessed()) {
      throw DomainException.paymentCannotBeProcessed();
    }

    this.status = PaymentStatus.PROCESSING;
    this.updatedAt = new Date();
  }

  markAsCompleted(stripePaymentIntentId?: string): void {
    if (this.status === PaymentStatus.COMPLETED) {
      // Idempotent: already completed
      return;
    }

    if (!this.canBeProcessed() && this.status !== PaymentStatus.PROCESSING) {
      throw DomainException.paymentCannotBeProcessed();
    }

    this.status = PaymentStatus.COMPLETED;
    this.completedAt = new Date();
    this.updatedAt = new Date();

    if (stripePaymentIntentId) {
      this.stripePaymentIntentId = stripePaymentIntentId;
    }
  }

  markAsFailed(failureReason?: string): void {
    this.status = PaymentStatus.FAILED;
    this.failureReason = failureReason;
    this.updatedAt = new Date();
  }

  markAsCancelled(): void {
    if (!this.canBeCancelled()) {
      throw DomainException.paymentCannotBeCancelled();
    }

    this.status = PaymentStatus.CANCELLED;
    this.updatedAt = new Date();
  }

  processRefund(refundAmount: Money, stripeRefundId?: string): void {
    if (!this.canBeRefunded()) {
      throw DomainException.paymentCannotBeRefunded();
    }

    if (refundAmount.isGreaterThan(this.getRemainingRefundableAmount())) {
      throw DomainException.refundAmountTooLarge();
    }

    this.refundedAmount = refundAmount;
    this.stripeRefundId = stripeRefundId;

    if (refundAmount.equals(this.amount)) {
      this.status = PaymentStatus.REFUNDED;
    } else {
      this.status = PaymentStatus.PARTIALLY_REFUNDED;
    }

    this.updatedAt = new Date();
  }

  // Comparison
  equals(other: Payment): boolean {
    return this.id === other.id && this.version === other.version;
  }
}

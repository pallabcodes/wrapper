/**
 * Domain Exception
 *
 * Represents business rule violations in the payment domain
 */
export class DomainException extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'DomainException';

    // Maintain proper stack trace
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, DomainException);
    }
  }

  static paymentNotFound(paymentId: string): DomainException {
    return new DomainException(`Payment not found: ${paymentId}`, 'PAYMENT_NOT_FOUND');
  }

  static paymentCannotBeProcessed(): DomainException {
    return new DomainException('Payment cannot be processed in its current state', 'PAYMENT_CANNOT_BE_PROCESSED');
  }

  static paymentCannotBeRefunded(): DomainException {
    return new DomainException('Payment cannot be refunded in its current state', 'PAYMENT_CANNOT_BE_REFUNDED');
  }

  static paymentCannotBeCancelled(): DomainException {
    return new DomainException('Payment cannot be cancelled in its current state', 'PAYMENT_CANNOT_BE_CANCELLED');
  }

  static refundAmountTooLarge(): DomainException {
    return new DomainException('Refund amount exceeds remaining refundable amount', 'REFUND_AMOUNT_TOO_LARGE');
  }

  static invalidPaymentAmount(): DomainException {
    return new DomainException('Payment amount must be greater than zero', 'INVALID_PAYMENT_AMOUNT');
  }

  static paymentMethodNotSupported(): DomainException {
    return new DomainException('Payment method is not supported', 'PAYMENT_METHOD_NOT_SUPPORTED');
  }

  static stripeError(message: string): DomainException {
    return new DomainException(`Stripe error: ${message}`, 'STRIPE_ERROR');
  }

  // Subscription-specific exceptions
  static subscriptionNotFound(subscriptionId: string): DomainException {
    return new DomainException(`Subscription not found: ${subscriptionId}`, 'SUBSCRIPTION_NOT_FOUND');
  }

  static subscriptionCannotBeCanceled(): DomainException {
    return new DomainException('Subscription cannot be cancelled in its current state', 'SUBSCRIPTION_CANNOT_BE_CANCELLED');
  }

  static subscriptionCannotBeReactivated(): DomainException {
    return new DomainException('Subscription cannot be reactivated in its current state', 'SUBSCRIPTION_CANNOT_BE_REACTIVATED');
  }

  static subscriptionCannotBePaused(): DomainException {
    return new DomainException('Subscription cannot be paused in its current state', 'SUBSCRIPTION_CANNOT_BE_PAUSED');
  }

  static subscriptionCannotBeResumed(): DomainException {
    return new DomainException('Subscription cannot be resumed in its current state', 'SUBSCRIPTION_CANNOT_BE_RESUMED');
  }

  static subscriptionAlreadyExists(userId: string): DomainException {
    return new DomainException(`User already has an active subscription: ${userId}`, 'SUBSCRIPTION_ALREADY_EXISTS');
  }

  static invalidSubscriptionInterval(): DomainException {
    return new DomainException('Invalid subscription interval', 'INVALID_SUBSCRIPTION_INTERVAL');
  }
}

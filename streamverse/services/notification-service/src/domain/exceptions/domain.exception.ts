/**
 * Domain Exception
 *
 * Represents business rule violations in the notification domain
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

  static notificationNotFound(notificationId: string): DomainException {
    return new DomainException(`Notification not found: ${notificationId}`, 'NOTIFICATION_NOT_FOUND');
  }

  static notificationCannotBeSent(): DomainException {
    return new DomainException('Notification cannot be sent in its current state', 'NOTIFICATION_CANNOT_BE_SENT');
  }

  static notificationCannotBeCancelled(): DomainException {
    return new DomainException('Notification cannot be cancelled in its current state', 'NOTIFICATION_CANNOT_BE_CANCELLED');
  }

  static invalidNotificationType(): DomainException {
    return new DomainException('Invalid notification type', 'INVALID_NOTIFICATION_TYPE');
  }

  static invalidRecipient(): DomainException {
    return new DomainException('Invalid recipient for notification type', 'INVALID_RECIPIENT');
  }

  static templateNotFound(templateName: string): DomainException {
    return new DomainException(`Notification template not found: ${templateName}`, 'TEMPLATE_NOT_FOUND');
  }

  static providerError(provider: string, message: string): DomainException {
    return new DomainException(`${provider} error: ${message}`, 'PROVIDER_ERROR');
  }

  static rateLimitExceeded(): DomainException {
    return new DomainException('Rate limit exceeded for notifications', 'RATE_LIMIT_EXCEEDED');
  }
}

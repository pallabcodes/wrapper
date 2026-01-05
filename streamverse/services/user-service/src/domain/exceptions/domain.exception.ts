/**
 * Domain Exception
 *
 * Represents business rule violations in the domain layer
 * Should be caught and handled in application layer
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

  static userNotFound(userId: string): DomainException {
    return new DomainException(`User not found: ${userId}`, 'USER_NOT_FOUND');
  }

  static emailAlreadyExists(email: string): DomainException {
    return new DomainException(`Email already exists: ${email}`, 'EMAIL_EXISTS');
  }

  static usernameAlreadyExists(username: string): DomainException {
    return new DomainException(`Username already exists: ${username}`, 'USERNAME_EXISTS');
  }

  static invalidCredentials(): DomainException {
    return new DomainException('Invalid credentials', 'INVALID_CREDENTIALS');
  }

  static userNotVerified(): DomainException {
    return new DomainException('User account not verified', 'USER_NOT_VERIFIED');
  }

  static accountLocked(): DomainException {
    return new DomainException('Account is temporarily locked due to too many failed login attempts', 'ACCOUNT_LOCKED');
  }

  static invalidVerificationToken(): DomainException {
    return new DomainException('Invalid or expired verification token', 'INVALID_VERIFICATION_TOKEN');
  }
}

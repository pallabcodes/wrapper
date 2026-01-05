/**
 * Domain Value Object: Email
 *
 * Represents a validated email address
 * Immutable and ensures email format correctness
 */
export class Email {
  private constructor(private readonly value: string) {}

  static create(email: string): Email {
    if (!email || typeof email !== 'string') {
      throw new Error('Email must be a non-empty string');
    }

    const trimmed = email.trim().toLowerCase();

    // RFC 5322 compliant email regex (simplified)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!emailRegex.test(trimmed)) {
      throw new Error('Invalid email format');
    }

    if (trimmed.length > 254) {
      throw new Error('Email address is too long');
    }

    return new Email(trimmed);
  }

  static fromString(email: string): Email {
    return Email.create(email);
  }

  getValue(): string {
    return this.value;
  }

  getDomain(): string {
    return this.value.split('@')[1];
  }

  getLocalPart(): string {
    return this.value.split('@')[0];
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }
}

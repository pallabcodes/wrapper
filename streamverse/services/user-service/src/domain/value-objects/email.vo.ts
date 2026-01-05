import { DomainException } from '../exceptions/domain.exception';

/**
 * Value Object: Email
 *
 * Immutable email address with validation
 * Ensures email format correctness and business rules
 */
export class Email {
  private constructor(private readonly value: string) {}

  static create(value: string): Email {
    if (!value || value.trim().length === 0) {
      throw new DomainException('Email cannot be empty');
    }

    const trimmed = value.trim().toLowerCase();

    if (trimmed.length > 254) {
      throw new DomainException('Email cannot exceed 254 characters');
    }

    // Basic email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      throw new DomainException('Invalid email format');
    }

    return new Email(trimmed);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  getDomain(): string {
    return this.value.split('@')[1];
  }

  getLocalPart(): string {
    return this.value.split('@')[0];
  }
}

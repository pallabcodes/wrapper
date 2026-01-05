import { DomainException } from '../exceptions/domain.exception';

/**
 * Value Object: Username
 *
 * Immutable username with validation
 * Ensures username format and business rules
 */
export class Username {
  private constructor(private readonly value: string) {}

  static create(value: string): Username {
    if (!value || value.trim().length === 0) {
      throw new DomainException('Username cannot be empty');
    }

    const trimmed = value.trim();

    if (trimmed.length < 3) {
      throw new DomainException('Username must be at least 3 characters');
    }

    if (trimmed.length > 30) {
      throw new DomainException('Username cannot exceed 30 characters');
    }

    // Only alphanumeric, underscore, and hyphen allowed
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(trimmed)) {
      throw new DomainException(
        'Username can only contain letters, numbers, underscores, and hyphens'
      );
    }

    // Cannot start or end with underscore/hyphen
    if (trimmed.startsWith('_') || trimmed.startsWith('-') ||
        trimmed.endsWith('_') || trimmed.endsWith('-')) {
      throw new DomainException('Username cannot start or end with underscore or hyphen');
    }

    return new Username(trimmed);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Username): boolean {
    return this.value === other.value;
  }

  getDisplayName(): string {
    return this.value;
  }
}

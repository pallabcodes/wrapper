import { DomainException } from '../exceptions/domain.exception';
import * as bcrypt from 'bcrypt';

/**
 * Value Object: Password
 *
 * Handles password validation, hashing, and verification
 * Ensures password security requirements
 */
export class Password {
  private constructor(
    private readonly hashedValue: string,
    private readonly isHashed: boolean = true
  ) {}

  static create(plainPassword: string): Password {
    if (!plainPassword || plainPassword.length === 0) {
      throw new DomainException('Password cannot be empty');
    }

    if (plainPassword.length < 8) {
      throw new DomainException('Password must be at least 8 characters');
    }

    if (plainPassword.length > 128) {
      throw new DomainException('Password cannot exceed 128 characters');
    }

    // Check for basic complexity
    const hasUpperCase = /[A-Z]/.test(plainPassword);
    const hasLowerCase = /[a-z]/.test(plainPassword);
    const hasNumbers = /\d/.test(plainPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      throw new DomainException(
        'Password must contain uppercase, lowercase, and numbers'
      );
    }

    return new Password(plainPassword, false);
  }

  static fromHash(hashedPassword: string): Password {
    if (!hashedPassword || hashedPassword.length === 0) {
      throw new DomainException('Hashed password cannot be empty');
    }
    return new Password(hashedPassword, true);
  }

  async hash(): Promise<Password> {
    if (this.isHashed) {
      return this;
    }

    try {
      const saltRounds = 12;
      const hashed = await bcrypt.hash(this.hashedValue, saltRounds);
      return new Password(hashed, true);
    } catch (error) {
      throw new DomainException('Failed to hash password');
    }
  }

  async compare(plainPassword: string): Promise<boolean> {
    if (!this.isHashed) {
      throw new DomainException('Password must be hashed before comparison');
    }

    try {
      return await bcrypt.compare(plainPassword, this.hashedValue);
    } catch (error) {
      return false;
    }
  }

  getValue(): string {
    return this.hashedValue;
  }

  isAlreadyHashed(): boolean {
    return this.isHashed;
  }
}

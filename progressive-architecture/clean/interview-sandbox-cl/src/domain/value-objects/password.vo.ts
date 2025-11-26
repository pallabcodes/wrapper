import * as bcrypt from 'bcrypt';
import type { AuthConfig } from '../../infrastructure/config/auth.config';

export class Password {
  private constructor(
    private readonly value: string,
    private readonly isHashed = false,
    private readonly config: AuthConfig,
  ) {
    if (!isHashed) {
      this.validate();
    }
  }

  static create(password: string, config: AuthConfig): Password {
    return new Password(password, false, config);
  }

  static fromHash(hash: string, config: AuthConfig): Password {
    return new Password(hash, true, config);
  }

  async hash(): Promise<string> {
    if (this.isHashed) {
      return this.value;
    }
    return bcrypt.hash(this.value, this.config.BCRYPT.SALT_ROUNDS);
  }

  async compare(plainPassword: string): Promise<boolean> {
    if (this.isHashed) {
      return bcrypt.compare(plainPassword, this.value);
    }
    throw new Error('Cannot compare plain password with plain password');
  }

  private validate(): void {
    const config = this.config.PASSWORD;

    if (!this.value || this.value.length < config.MIN_LENGTH) {
      throw new Error(`Password must be at least ${config.MIN_LENGTH} characters long`);
    }

    if (config.REQUIRE_LOWERCASE && !/(?=.*[a-z])/.test(this.value)) {
      throw new Error('Password must contain at least one lowercase letter');
    }

    if (config.REQUIRE_UPPERCASE && !/(?=.*[A-Z])/.test(this.value)) {
      throw new Error('Password must contain at least one uppercase letter');
    }

    if (config.REQUIRE_NUMBER && !/(?=.*\d)/.test(this.value)) {
      throw new Error('Password must contain at least one number');
    }
  }
}


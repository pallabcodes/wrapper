import * as bcrypt from 'bcrypt';

export class Password {
  private constructor(private readonly value: string, private readonly isHashed = false) {
    if (!isHashed) {
      this.validate();
    }
  }

  static create(password: string): Password {
    return new Password(password, false);
  }

  static fromHash(hash: string): Password {
    return new Password(hash, true);
  }

  async hash(): Promise<string> {
    if (this.isHashed) {
      return this.value;
    }
    const saltRounds = 12; // Should be configurable
    return bcrypt.hash(this.value, saltRounds);
  }

  async compare(hashedPassword: string): Promise<boolean> {
    if (this.isHashed) {
      return bcrypt.compare(this.value, hashedPassword);
    }
    return bcrypt.compare(this.value, hashedPassword);
  }

  private validate(): void {
    const config = { minLength: 8, requireUppercase: true, requireLowercase: true, requireNumber: true };

    if (!this.value || this.value.length < config.minLength) {
      throw new Error(`Password must be at least ${config.minLength} characters long`);
    }

    if (config.requireLowercase && !/(?=.*[a-z])/.test(this.value)) {
      throw new Error('Password must contain at least one lowercase letter');
    }

    if (config.requireUppercase && !/(?=.*[A-Z])/.test(this.value)) {
      throw new Error('Password must contain at least one uppercase letter');
    }

    if (config.requireNumber && !/(?=.*\d)/.test(this.value)) {
      throw new Error('Password must contain at least one number');
    }
  }
}

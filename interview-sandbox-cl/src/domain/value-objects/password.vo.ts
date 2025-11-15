import * as bcrypt from 'bcrypt';

export class Password {
  private constructor(private readonly value: string) {
    this.validate();
  }

  static create(password: string): Password {
    return new Password(password);
  }

  static fromHash(hash: string): Password {
    const password = new Password('dummy'); // Bypass validation for hash
    (password as any).value = hash;
    (password as any).isHash = true;
    return password;
  }

  hash(): string {
    if ((this as any).isHash) {
      return this.value;
    }
    const saltRounds = 12;
    return bcrypt.hashSync(this.value, saltRounds);
  }

  compare(hashedPassword: string): boolean {
    return bcrypt.compareSync(this.value, hashedPassword);
  }

  private validate(): void {
    if (!this.value || this.value.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
  }
}


export class Email {
  private constructor(private readonly value: string) {
    this.validate();
  }

  static create(email: string): Email {
    return new Email(email);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  private validate(): void {
    if (!this.value || this.value.trim().length === 0) {
      throw new Error('Email cannot be empty');
    }

    if (this.value.length > 254) {
      throw new Error('Email is too long');
    }

    // RFC 5322 compliant email regex (simplified but more comprehensive)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(this.value)) {
      throw new Error('Invalid email format');
    }

    // Additional security checks
    if (this.value.includes('<') || this.value.includes('>') || this.value.includes('"')) {
      throw new Error('Invalid characters in email');
    }
  }
}


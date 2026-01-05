/**
 * Domain Value Object: Phone Number
 *
 * Represents a validated phone number for SMS notifications
 * Supports international formats and validation
 */
export class PhoneNumber {
  private constructor(
    private readonly value: string,
    private readonly countryCode: string,
    private readonly nationalNumber: string
  ) {}

  static create(phoneNumber: string): PhoneNumber {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      throw new Error('Phone number must be a non-empty string');
    }

    const cleaned = phoneNumber.replace(/[\s\-\(\)\.]/g, '');

    // Check if it starts with + for international format
    if (!cleaned.startsWith('+')) {
      throw new Error('Phone number must be in international format starting with +');
    }

    // Remove + and check if remaining is all digits
    const digitsOnly = cleaned.substring(1);
    if (!/^\d+$/.test(digitsOnly)) {
      throw new Error('Phone number must contain only digits after the + prefix');
    }

    // Basic length validation (international numbers are typically 7-15 digits)
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      throw new Error('Phone number length is invalid');
    }

    // Extract country code (first 1-3 digits after +)
    let countryCode = '';
    let nationalNumber = '';

    if (digitsOnly.length >= 10) {
      // Assume 1-3 digit country code
      for (let i = 1; i <= 3 && i < digitsOnly.length; i++) {
        const potentialCountryCode = digitsOnly.substring(0, i);
        const remainingDigits = digitsOnly.substring(i);

        // Basic validation - country codes are typically 1-3 digits
        if (potentialCountryCode.length >= 1 && potentialCountryCode.length <= 3) {
          countryCode = potentialCountryCode;
          nationalNumber = remainingDigits;
          break;
        }
      }
    } else {
      // For shorter numbers, assume single digit country code
      countryCode = digitsOnly.charAt(0);
      nationalNumber = digitsOnly.substring(1);
    }

    return new PhoneNumber(cleaned, countryCode, nationalNumber);
  }

  static fromString(phoneNumber: string): PhoneNumber {
    return PhoneNumber.create(phoneNumber);
  }

  getValue(): string {
    return this.value;
  }

  getCountryCode(): string {
    return this.countryCode;
  }

  getNationalNumber(): string {
    return this.nationalNumber;
  }

  getFormattedNumber(): string {
    return `+${this.countryCode} ${this.nationalNumber}`;
  }

  equals(other: PhoneNumber): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  toJSON(): { value: string; countryCode: string; nationalNumber: string } {
    return {
      value: this.value,
      countryCode: this.countryCode,
      nationalNumber: this.nationalNumber
    };
  }
}

import { DomainException } from "../exceptions/domain.exception";

export class PhoneNumber {
    private readonly value: string;

    private constructor(value: string) {
        this.value = value;
    }

    public static create(value: string): PhoneNumber {
        if (!value) {
            throw new DomainException("Phone number is required");
        }

        const cleaned = value.trim();
        if (!this.validate(cleaned)) {
            throw new DomainException("Invalid phone number format. Must be E.164 format (e.g. +1234567890)");
        }

        return new PhoneNumber(cleaned);
    }

    public getValue(): string {
        return this.value;
    }

    public equals(other: PhoneNumber): boolean {
        return this.value === other.value;
    }

    private static validate(value: string): boolean {
        // E.164 regex: + followed by 1-15 digits
        const e164Regex = /^\+[1-9]\d{1,14}$/;
        return e164Regex.test(value);
    }
}

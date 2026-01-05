import { DomainException } from '../exceptions/domain.exception';

/**
 * Value Object: ClientId
 * Immutable identifier for rate limit subjects
 */
export class ClientId {
    private constructor(private readonly value: string) { }

    static create(value: string): ClientId {
        if (!value || value.trim().length === 0) {
            throw new DomainException('ClientId cannot be empty');
        }
        if (value.length > 255) {
            throw new DomainException('ClientId cannot exceed 255 characters');
        }
        return new ClientId(value.trim());
    }

    getValue(): string {
        return this.value;
    }

    equals(other: ClientId): boolean {
        return this.value === other.value;
    }
}

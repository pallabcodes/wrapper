import { ValueObject } from './value-object';

/**
 * User ID Value Object
 * Ensures type safety for user identifiers
 */
export class UserId extends ValueObject<string> {
  static create(): UserId {
    return new UserId(crypto.randomUUID());
  }

  static fromString(id: string): UserId {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new Error('Invalid user ID: must be a non-empty string');
    }

    // Basic UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new Error('Invalid user ID: must be a valid UUID');
    }

    return new UserId(id);
  }

  get value(): string {
    return this._value;
  }
}
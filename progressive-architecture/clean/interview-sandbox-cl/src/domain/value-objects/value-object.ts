/**
 * Base class for all Value Objects
 * Value Objects are immutable and compared by value, not reference
 */
export abstract class ValueObject<T = unknown> {
  protected readonly _value: T;

  constructor(value: T) {
    this._value = this.validate(value);
  }

  /**
   * Get the value of the Value Object
   */
  get value(): T {
    return this._value;
  }

  /**
   * Validate the value (override in subclasses)
   */
  protected validate(value: T): T {
    return value;
  }

  /**
   * Check equality with another Value Object
   */
  equals(other: ValueObject<T>): boolean {
    if (!other || !(other instanceof ValueObject)) {
      return false;
    }
    return this._value === other._value;
  }

  /**
   * Convert to string for debugging/logging
   */
  toString(): string {
    return String(this._value);
  }
}
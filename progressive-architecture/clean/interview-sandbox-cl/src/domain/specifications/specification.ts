/**
 * Specification Pattern Interface
 * Allows building complex query logic in a composable, testable way
 */
export interface Specification<T> {
  /**
   * Check if entity satisfies the specification
   */
  isSatisfiedBy(entity: T): boolean;

  /**
   * Convert to SQL WHERE clause (for database queries)
   */
  toSql(): string;

  /**
   * Get parameters for SQL query
   */
  getParameters(): any[];

  /**
   * Combine with another specification using AND
   */
  and(other: Specification<T>): Specification<T>;

  /**
   * Combine with another specification using OR
   */
  or(other: Specification<T>): Specification<T>;

  /**
   * Negate the specification
   */
  not(): Specification<T>;
}

/**
 * Base Specification class with common logic
 */
export abstract class BaseSpecification<T> implements Specification<T> {
  abstract isSatisfiedBy(entity: T): boolean;
  abstract toSql(): string;
  abstract getParameters(): any[];

  and(other: Specification<T>): Specification<T> {
    return new AndSpecification(this, other);
  }

  or(other: Specification<T>): Specification<T> {
    return new OrSpecification(this, other);
  }

  not(): Specification<T> {
    return new NotSpecification(this);
  }
}

/**
 * AND combination of specifications
 */
export class AndSpecification<T> extends BaseSpecification<T> {
  constructor(
    private readonly left: Specification<T>,
    private readonly right: Specification<T>
  ) {
    super();
  }

  isSatisfiedBy(entity: T): boolean {
    return this.left.isSatisfiedBy(entity) && this.right.isSatisfiedBy(entity);
  }

  toSql(): string {
    return `(${this.left.toSql()} AND ${this.right.toSql()})`;
  }

  getParameters(): any[] {
    return [...this.left.getParameters(), ...this.right.getParameters()];
  }
}

/**
 * OR combination of specifications
 */
export class OrSpecification<T> extends BaseSpecification<T> {
  constructor(
    private readonly left: Specification<T>,
    private readonly right: Specification<T>
  ) {
    super();
  }

  isSatisfiedBy(entity: T): boolean {
    return this.left.isSatisfiedBy(entity) || this.right.isSatisfiedBy(entity);
  }

  toSql(): string {
    return `(${this.left.toSql()} OR ${this.right.toSql()})`;
  }

  getParameters(): any[] {
    return [...this.left.getParameters(), ...this.right.getParameters()];
  }
}

/**
 * NOT specification
 */
export class NotSpecification<T> extends BaseSpecification<T> {
  constructor(private readonly specification: Specification<T>) {
    super();
  }

  isSatisfiedBy(entity: T): boolean {
    return !this.specification.isSatisfiedBy(entity);
  }

  toSql(): string {
    return `NOT (${this.specification.toSql()})`;
  }

  getParameters(): any[] {
    return this.specification.getParameters();
  }
}
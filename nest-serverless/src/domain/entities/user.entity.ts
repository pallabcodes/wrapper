/**
 * Domain Entity: User
 * 
 * Pure business logic - no dependencies on frameworks or infrastructure
 * Contains business rules and domain methods
 * 
 * This is the "Entity" in Hexagonal Architecture
 */
export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string,
    public readonly passwordHash: string,
    public readonly isEmailVerified: boolean = false,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  /**
   * Business Rule: User can login only if email is verified
   */
  canLogin(): boolean {
    return this.isEmailVerified;
  }

  /**
   * Business Rule: Verify email and return new User instance (immutability)
   */
  verifyEmail(): User {
    return new User(
      this.id,
      this.email,
      this.name,
      this.passwordHash,
      true, // Email verified
      this.createdAt,
      new Date(), // Updated timestamp
    );
  }

  /**
   * Business Rule: Check if user can make payments
   */
  canMakePayment(): boolean {
    return this.isEmailVerified && this.email.length > 0;
  }
}


/**
 * Domain Entity: User
 * 
 * Pure business logic, no external dependencies
 * Part of Hexagonal Architecture - Domain Layer
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
   * Business rule: User can login only if email is verified
   */
  canLogin(): boolean {
    return this.isEmailVerified;
  }

  /**
   * Business rule: User can make payments only if verified
   */
  canMakePayment(): boolean {
    return this.isEmailVerified && this.email !== null;
  }

  /**
   * Domain method: Mark email as verified
   */
  verifyEmail(): User {
    return new User(
      this.id,
      this.email,
      this.name,
      this.passwordHash,
      true, // isEmailVerified
      this.createdAt,
      new Date(), // updatedAt
    );
  }
}


import { Email } from '../value-objects/email.vo';
import { Password } from '../value-objects/password.vo';

export type UserRole = 'USER' | 'ADMIN' | 'MODERATOR';

export class User {
  private constructor(
    public readonly id: string,
    public readonly email: Email,
    public readonly name: string,
    public readonly role: UserRole,
    public readonly passwordHash: string,
    public readonly isEmailVerified: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    email: Email,
    name: string,
    password: Password,
    role: UserRole = 'USER',
  ): User {
    return new User(
      this.generateId(),
      email,
      name,
      role,
      password.hash(),
      false,
      new Date(),
      new Date(),
    );
  }

  static reconstitute(
    id: string,
    email: Email,
    name: string,
    role: UserRole,
    passwordHash: string,
    isEmailVerified: boolean,
    createdAt: Date,
    updatedAt: Date,
  ): User {
    return new User(
      id,
      email,
      name,
      role,
      passwordHash,
      isEmailVerified,
      createdAt,
      updatedAt,
    );
  }

  // Business logic
  canAccessResource(resourceOwnerId: string): boolean {
    return this.role === 'ADMIN' || this.id === resourceOwnerId;
  }

  hasRole(role: UserRole): boolean {
    return this.role === role;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    return roles.includes(this.role);
  }

  verifyEmail(): User {
    return new User(
      this.id,
      this.email,
      this.name,
      this.role,
      this.passwordHash,
      true,
      this.createdAt,
      new Date(),
    );
  }

  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}


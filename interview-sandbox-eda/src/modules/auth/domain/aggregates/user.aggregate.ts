import { AggregateRoot } from '../../../../shared/domain/aggregate-root';
import { UserRegisteredEvent } from '../../../../events/auth/user-registered.event';
import { UserEmailVerifiedEvent } from '../../../../events/auth/user-email-verified.event';
import { Email } from '../value-objects/email.vo';
import { Password } from '../value-objects/password.vo';

export type UserRole = 'USER' | 'ADMIN' | 'MODERATOR';

export class UserAggregate extends AggregateRoot {
  private _email: Email;
  private _name: string;
  private _passwordHash: string;
  private _role: UserRole;
  private _isEmailVerified: boolean;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(
    id: string,
    email: Email,
    name: string,
    passwordHash: string,
    role: UserRole = 'USER',
    isEmailVerified: boolean = false,
  ) {
    super(id);
    this._email = email;
    this._name = name;
    this._passwordHash = passwordHash;
    this._role = role;
    this._isEmailVerified = isEmailVerified;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  // Factory method - static creation
  static register(
    id: string,
    email: Email,
    name: string,
    password: Password,
    role: UserRole = 'USER',
  ): UserAggregate {
    const user = new UserAggregate(id, email, name, password.hash(), role);

    // Publish domain event
    user.addDomainEvent(
      new UserRegisteredEvent(id, email.getValue(), name)
    );

    return user;
  }

  // Business methods
  verifyEmail(): void {
    if (this._isEmailVerified) {
      throw new Error('Email is already verified');
    }

    this._isEmailVerified = true;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new UserEmailVerifiedEvent(this.id, this._email.getValue(), this._updatedAt)
    );
  }

  canAccessResource(resourceOwnerId: string): boolean {
    return this._role === 'ADMIN' || this.id === resourceOwnerId;
  }

  hasRole(role: UserRole): boolean {
    return this._role === role;
  }

  // Getters
  get email(): Email {
    return this._email;
  }

  get name(): string {
    return this._name;
  }

  get passwordHash(): string {
    return this._passwordHash;
  }

  get role(): UserRole {
    return this._role;
  }

  get isEmailVerified(): boolean {
    return this._isEmailVerified;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}

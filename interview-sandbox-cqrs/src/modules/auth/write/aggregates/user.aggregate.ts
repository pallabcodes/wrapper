import { AggregateRoot } from '../../../../shared/domain/aggregate-root';
import { UserCreatedEvent } from '../../events/user-created.event';
import { UserEmailChangedEvent } from '../../events/user-email-changed.event';
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
  static create(
    id: string,
    email: Email,
    name: string,
    password: Password,
    role: UserRole = 'USER',
  ): UserAggregate {
    const user = new UserAggregate(id, email, name, password.hash(), role);

    // Apply domain event
    user.applyChange(
      new UserCreatedEvent(id, email.getValue(), name, password.hash(), role)
    );

    return user;
  }

  // Business methods
  changeEmail(newEmail: Email): void {
    if (this._email.equals(newEmail)) {
      return; // No change needed
    }

    const oldEmail = this._email.getValue();
    this._email = newEmail;
    this._updatedAt = new Date();

    this.applyChange(
      new UserEmailChangedEvent(this.id, newEmail.getValue(), oldEmail)
    );
  }

  verifyPassword(password: Password): boolean {
    return password.compare(this._passwordHash);
  }

  canAccessResource(resourceOwnerId: string): boolean {
    return this._role === 'ADMIN' || this.id === resourceOwnerId;
  }

  hasRole(role: UserRole): boolean {
    return this._role === role;
  }

  // Event application
  protected applyEvent(event: any): void {
    switch (event.eventType) {
      case 'UserEmailChangedEvent':
        this._email = Email.create(event.newEmail);
        this._updatedAt = event.timestamp;
        break;
    }
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

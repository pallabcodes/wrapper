import { AggregateRoot } from '../../../../shared/domain/aggregate-root';
import { UserRegisteredEvent } from '../events/user-registered.event';
import { UserEmailVerifiedEvent } from '../events/user-email-verified.event';
import { User } from '../entities/user.entity';
import { Email } from '../value-objects/email.vo';
import { Password } from '../value-objects/password.vo';
import { UserRole } from '../entities/user.entity';

export class UserAggregate extends AggregateRoot {
  private user: User;

  constructor(user: User) {
    super();
    this.user = user;
    (this as any)._id = user.id;
  }

  // Factory method
  static async create(
    id: string,
    email: Email,
    name: string,
    password: Password,
    role: UserRole = 'USER',
  ): Promise<UserAggregate> {
    const user = await User.create(id, email, name, password, role);
    const aggregate = new UserAggregate(user);

    // Add domain event
    aggregate.addDomainEvent(new UserRegisteredEvent(id, email.getValue(), name, role));

    return aggregate;
  }

  // Business methods
  changeEmail(newEmail: Email): void {
    this.user.changeEmail(newEmail);
    // Could add UserEmailChangedEvent here if needed
  }

  async changePassword(newPassword: Password): Promise<void> {
    await this.user.changePassword(newPassword);
    // Could add UserPasswordChangedEvent here if needed
  }

  verifyEmail(): void {
    this.user.verifyEmail();
    this.addDomainEvent(new UserEmailVerifiedEvent(this.user.id, this.user.email.getValue()));
  }

  changeRole(newRole: UserRole): void {
    this.user.changeRole(newRole);
    // Could add UserRoleChangedEvent here if needed
  }

  async verifyPassword(password: Password): Promise<boolean> {
    return this.user.verifyPassword(password);
  }

  canAccessResource(resourceOwnerId: string): boolean {
    return this.user.canAccessResource(resourceOwnerId);
  }

  hasRole(role: UserRole): boolean {
    return this.user.hasRole(role);
  }

  // Getters that delegate to the entity
  get id(): string {
    return this.user.id;
  }

  get email(): Email {
    return this.user.email;
  }

  get name(): string {
    return this.user.name;
  }

  get passwordHash(): string {
    return this.user.passwordHash;
  }

  get role(): UserRole {
    return this.user.role;
  }

  get isEmailVerified(): boolean {
    return this.user.isEmailVerified;
  }

  get createdAt(): Date {
    return this.user.createdAt;
  }

  get updatedAt(): Date {
    return this.user.updatedAt;
  }

  // Aggregate root methods
  getUser(): User {
    return this.user;
  }
}

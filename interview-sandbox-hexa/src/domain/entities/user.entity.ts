import { Email } from '../value-objects/email.vo';
import { Password } from '../value-objects/password.vo';

export type UserRole = 'USER' | 'ADMIN' | 'MODERATOR';

export class User {
  private _email: Email;
  private _name: string;
  private _passwordHash: string;
  private _role: UserRole;
  private _isEmailVerified: boolean;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(
    private readonly _id: string,
    email: Email,
    name: string,
    passwordHash: string,
    role: UserRole = 'USER',
    isEmailVerified: boolean = false,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this._email = email;
    this._name = name;
    this._passwordHash = passwordHash;
    this._role = role;
    this._isEmailVerified = isEmailVerified;
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
  }

  // Factory method
  static async create(
    id: string,
    email: Email,
    name: string,
    password: Password,
    role: UserRole = 'USER',
  ): Promise<User> {
    const passwordHash = await password.hash();
    return new User(id, email, name, passwordHash, role);
  }

  // Business methods
  changeEmail(newEmail: Email): void {
    // Business rule: Can only change email if not verified
    if (this._isEmailVerified) {
      throw new Error('Cannot change email after verification');
    }

    this._email = newEmail;
    this._updatedAt = new Date();
  }

  async changePassword(newPassword: Password): Promise<void> {
    this._passwordHash = await newPassword.hash();
    this._updatedAt = new Date();
  }

  verifyEmail(): void {
    if (this._isEmailVerified) {
      throw new Error('Email is already verified');
    }

    this._isEmailVerified = true;
    this._updatedAt = new Date();
  }

  changeRole(newRole: UserRole): void {
    // Business rule: Only admin can change roles
    this._role = newRole;
    this._updatedAt = new Date();
  }

  async verifyPassword(password: Password): Promise<boolean> {
    return password.compare(this._passwordHash);
  }

  canAccessResource(resourceOwnerId: string): boolean {
    return this._role === 'ADMIN' || this._id === resourceOwnerId;
  }

  hasRole(role: UserRole): boolean {
    return this._role === role;
  }

  // Getters
  get id(): string {
    return this._id;
  }

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

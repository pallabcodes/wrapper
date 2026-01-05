import { Email } from '../value-objects/email.vo';
import { Password } from '../value-objects/password.vo';
import { Username } from '../value-objects/username.vo';
import { PhoneNumber } from '../value-objects/phone-number.vo'; // New import
import { DomainException } from '../exceptions/domain.exception';

export enum UserRole {
  VIEWER = 'viewer',
  STREAMER = 'streamer',
  ADMIN = 'admin'
}

export enum UserStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETED = 'deleted'
}

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google'
}

/**
 * Domain Entity: User
 *
 * Core business object representing a user in StreamVerse
 * Contains all fields, rules and behavours about this entity
 */
export class User {
  private constructor(
    private readonly id: string,
    private email: Email,
    private username: Username,
    private password: Password,
    private readonly role: UserRole,
    private status: UserStatus,
    private readonly authProvider: AuthProvider,
    private readonly googleId: string | undefined,
    private readonly phoneNumber: PhoneNumber | undefined,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private emailVerifiedAt?: Date,
    private lastLoginAt?: Date,
    private tokenVersion: number = 1,
    private failedLoginAttempts: number = 0,
    private accountLockedUntil?: Date,
    private readonly version: number = 1
  ) { }

  static create(
    id: string,
    email: Email,
    username: Username,
    password: Password,
    role: UserRole = UserRole.VIEWER,
    phoneNumber?: PhoneNumber
  ): User {
    const now = new Date();
    return new User(
      id,
      email,
      username,
      password,
      role,
      UserStatus.PENDING,
      AuthProvider.LOCAL,
      undefined, // googleId
      phoneNumber,
      now,
      now,
      undefined,
      undefined,
      1, // tokenVersion
      0, // failedLoginAttempts
      undefined, // accountLockedUntil
      1  // version
    );
  }

  /**
   * Factory method for creating users from OAuth providers (e.g., Google)
   * OAuth users are automatically verified and active
   */
  static createFromOAuth(
    id: string,
    email: Email,
    username: Username,
    provider: AuthProvider,
    providerId: string,
    role: UserRole = UserRole.VIEWER
  ): User {
    const now = new Date();
    // OAuth users get a random password hash (they can't use password login)
    const dummyPassword = Password.fromHash('$oauth$no-password-login');
    return new User(
      id,
      email,
      username,
      dummyPassword,
      role,
      UserStatus.ACTIVE, // OAuth users are immediately active
      provider,
      providerId,
      undefined, // phoneNumber
      now,
      now,
      now, // emailVerifiedAt - OAuth email is trusted
      now, // lastLoginAt
      1, // tokenVersion
      0, // failedLoginAttempts
      undefined, // accountLockedUntil
      1  // version
    );
  }

  static fromPersistence(data: {
    id: string;
    email: string;
    username: string;
    passwordHash: string;
    role: UserRole;
    status: UserStatus;
    authProvider?: AuthProvider;
    googleId?: string;
    phoneNumber?: string;
    createdAt: Date;
    updatedAt: Date;
    emailVerifiedAt?: Date;
    lastLoginAt?: Date;
    tokenVersion?: number;
    failedLoginAttempts?: number;
    accountLockedUntil?: Date;
    version: number;
  }): User {
    return new User(
      data.id,
      Email.create(data.email), // Validate even from persistence
      Username.create(data.username),
      Password.fromHash(data.passwordHash),
      data.role,
      data.status,
      data.authProvider ?? AuthProvider.LOCAL,
      data.googleId,
      data.phoneNumber ? PhoneNumber.create(data.phoneNumber) : undefined,
      data.createdAt,
      data.updatedAt,
      data.emailVerifiedAt,
      data.lastLoginAt,
      data.tokenVersion ?? 1,
      data.failedLoginAttempts ?? 0,
      data.accountLockedUntil,
      data.version
    );
  }

  // Business Methods

  async changePassword(currentPassword: string, newPassword: Password): Promise<void> {
    const isValid = await this.password.compare(currentPassword);
    if (!isValid) {
      throw DomainException.invalidCredentials();
    }

    this.password = await newPassword.hash();
    this.updatedAt = new Date();
  }

  verifyEmail(): void {
    if (this.status !== UserStatus.PENDING) {
      throw new DomainException('User is not in pending status');
    }

    this.emailVerifiedAt = new Date();
    this.status = UserStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  recordLogin(): void {
    this.lastLoginAt = new Date();
    this.updatedAt = new Date();
  }

  suspend(reason?: string): void {
    if (this.status === UserStatus.DELETED) {
      throw new DomainException('Cannot suspend deleted user');
    }

    this.status = UserStatus.SUSPENDED;
    this.updatedAt = new Date();
  }

  reactivate(): void {
    if (this.status !== UserStatus.SUSPENDED) {
      throw new DomainException('User is not suspended');
    }

    this.status = UserStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  // Getters

  getId(): string {
    return this.id;
  }

  getEmail(): Email {
    return this.email;
  }

  getUsername(): Username {
    return this.username;
  }

  getPassword(): Password {
    return this.password;
  }

  getRole(): UserRole {
    return this.role;
  }

  getStatus(): UserStatus {
    return this.status;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getEmailVerifiedAt(): Date | undefined {
    return this.emailVerifiedAt;
  }

  getLastLoginAt(): Date | undefined {
    return this.lastLoginAt;
  }

  getVersion(): number {
    return this.version;
  }

  getTokenVersion(): number {
    return this.tokenVersion;
  }

  getFailedLoginAttempts(): number {
    return this.failedLoginAttempts;
  }

  getAccountLockedUntil(): Date | undefined {
    return this.accountLockedUntil;
  }

  getAuthProvider(): AuthProvider {
    return this.authProvider;
  }

  getGoogleId(): string | undefined {
    return this.googleId;
  }

  getPhoneNumber(): PhoneNumber | undefined {
    return this.phoneNumber;
  }

  // Business Rules

  isOAuthUser(): boolean {
    return this.authProvider !== AuthProvider.LOCAL;
  }

  // Business Rules

  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  isEmailVerified(): boolean {
    return this.emailVerifiedAt !== undefined;
  }

  markEmailAsVerified(): void {
    this.emailVerifiedAt = new Date();
    this.status = UserStatus.ACTIVE; // Activate user when email is verified
    this.updatedAt = new Date();
  }

  canLogin(): boolean {
    return this.isActive() && this.isEmailVerified();
  }

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  isStreamer(): boolean {
    return this.role === UserRole.STREAMER;
  }

  isAccountLocked(): boolean {
    if (!this.accountLockedUntil) return false;
    return new Date() < this.accountLockedUntil;
  }

  canAttemptLogin(maxAttempts: number = 5): boolean {
    return this.failedLoginAttempts < maxAttempts && !this.isAccountLocked();
  }

  recordFailedLogin(maxAttempts: number = 5, lockDurationMinutes: number = 15): boolean {
    this.failedLoginAttempts++;

    // Lock account if max attempts reached
    if (this.failedLoginAttempts >= maxAttempts) {
      this.accountLockedUntil = new Date(Date.now() + lockDurationMinutes * 60 * 1000);
      return true; // Account locked
    }

    return false; // Account not locked yet
  }

  clearFailedLoginAttempts(): void {
    this.failedLoginAttempts = 0;
    this.accountLockedUntil = undefined;
  }

  incrementTokenVersion(): number {
    this.tokenVersion++;
    return this.tokenVersion;
  }

  // Comparison

  equals(other: User): boolean {
    return this.id === other.id && this.version === other.version;
  }
}

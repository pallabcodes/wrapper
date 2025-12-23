import { BaseSpecification } from './specification';
import { User } from '../entities/user.entity';


/**
 * User-specific specifications for complex queries
 */

export class ActiveUsersSpecification extends BaseSpecification<User> {
  isSatisfiedBy(user: User): boolean {
    return user.isActive;
  }

  toSql(): string {
    return 'isActive = ?';
  }

  getParameters(): any[] {
    return [true];
  }
}

export class EmailVerifiedUsersSpecification extends BaseSpecification<User> {
  isSatisfiedBy(user: User): boolean {
    return user.isEmailVerified;
  }

  toSql(): string {
    return 'isEmailVerified = ?';
  }

  getParameters(): any[] {
    return [true];
  }
}

export class UsersByRoleSpecification extends BaseSpecification<User> {
  constructor(private readonly role: string) {
    super();
  }

  isSatisfiedBy(user: User): boolean {
    return user.role === this.role;
  }

  toSql(): string {
    return 'role = ?';
  }

  getParameters(): any[] {
    return [this.role];
  }
}

export class UsersByEmailDomainSpecification extends BaseSpecification<User> {
  constructor(private readonly domain: string) {
    super();
  }

  isSatisfiedBy(user: User): boolean {
    const emailDomain = user.email.getValue().split('@')[1];
    return emailDomain === this.domain;
  }

  toSql(): string {
    return 'email LIKE ?';
  }

  getParameters(): any[] {
    return [`%@${this.domain}`];
  }
}

export class UsersCreatedAfterSpecification extends BaseSpecification<User> {
  constructor(private readonly date: Date) {
    super();
  }

  isSatisfiedBy(user: User): boolean {
    return user.createdAt > this.date;
  }

  toSql(): string {
    return 'createdAt > ?';
  }

  getParameters(): any[] {
    return [this.date];
  }
}

export class UsersCreatedWithinLastDaysSpecification extends BaseSpecification<User> {
  constructor(private readonly days: number) {
    super();
  }

  isSatisfiedBy(user: User): boolean {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.days);
    return user.createdAt > cutoffDate;
  }

  toSql(): string {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.days);
    return 'createdAt > ?';
  }

  getParameters(): any[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.days);
    return [cutoffDate];
  }
}

/**
 * Composite specifications for common queries
 */
export class ActiveAndVerifiedUsersSpecification extends ActiveUsersSpecification {
  constructor() {
    super();
    // This would be: new ActiveUsersSpecification().and(new EmailVerifiedUsersSpecification())
    // But we'll implement it directly for simplicity
  }

  isSatisfiedBy(user: User): boolean {
    return user.isActive && user.isEmailVerified;
  }

  toSql(): string {
    return '(isActive = ? AND isEmailVerified = ?)';
  }

  getParameters(): any[] {
    return [true, true];
  }
}

export class AdminUsersSpecification extends UsersByRoleSpecification {
  constructor() {
    super('ADMIN');
  }
}

export class RecentActiveUsersSpecification extends ActiveUsersSpecification {
  constructor(private readonly days: number = 30) {
    super();
  }

  isSatisfiedBy(user: User): boolean {
    return super.isSatisfiedBy(user) && this.isRecent(user);
  }

  toSql(): string {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.days);
    return '(isActive = ? AND createdAt > ?)';
  }

  getParameters(): any[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.days);
    return [true, cutoffDate];
  }

  private isRecent(user: User): boolean {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.days);
    return user.createdAt > cutoffDate;
  }
}
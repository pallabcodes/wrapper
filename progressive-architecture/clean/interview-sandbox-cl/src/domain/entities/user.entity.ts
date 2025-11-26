import { randomUUID } from 'crypto';
import { Email } from '../value-objects/email.vo';
import { Password } from '../value-objects/password.vo';
import type { AuthConfig } from '../../infrastructure/config/auth.config';

export type UserRole = 'USER' | 'ADMIN' | 'MODERATOR';

export interface UserProps {
  id: string;
  email: Email;
  name: string;
  role: UserRole;
  passwordHash: string;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private constructor(private readonly props: UserProps) {}

  // Getters for immutability
  get id(): string { return this.props.id; }
  get email(): Email { return this.props.email; }
  get name(): string { return this.props.name; }
  get role(): UserRole { return this.props.role; }
  get passwordHash(): string { return this.props.passwordHash; }
  get isEmailVerified(): boolean { return this.props.isEmailVerified; }
  get isActive(): boolean { return this.props.isActive; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  static async create(
    email: Email,
    name: string,
    plainPassword: string,
    config: AuthConfig,
    role: UserRole = 'USER',
  ): Promise<User> {
    const password = Password.create(plainPassword, config);
    const hashedPassword = await password.hash();

    const props: UserProps = {
      id: randomUUID(),
      email,
      name,
      role,
      passwordHash: hashedPassword,
      isEmailVerified: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return new User(props);
  }

  static reconstitute(props: UserProps): User {
    return new User(props);
  }

  // Business logic methods
  canAccessResource(resourceOwnerId: string): boolean {
    return this.role === 'ADMIN' || this.id === resourceOwnerId;
  }

  hasRole(role: UserRole): boolean {
    return this.role === role;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    return roles.includes(this.role);
  }

  isAccountActive(): boolean {
    return this.isActive;
  }

  async verifyEmail(): Promise<User> {
    const newProps: UserProps = {
      ...this.props,
      isEmailVerified: true,
      updatedAt: new Date(),
    };
    return new User(newProps);
  }

  async changePassword(newPassword: string, config: AuthConfig): Promise<User> {
    const password = Password.create(newPassword, config);
    const hashedPassword = await password.hash();

    const newProps: UserProps = {
      ...this.props,
      passwordHash: hashedPassword,
      updatedAt: new Date(),
    };
    return new User(newProps);
  }

  updateProfile(name: string): User {
    const newProps: UserProps = {
      ...this.props,
      name,
      updatedAt: new Date(),
    };
    return new User(newProps);
  }

  // Factory method for testing
  static createForTest(props: Partial<UserProps>): User {
    const defaultProps: UserProps = {
      id: randomUUID(),
      email: Email.create('test@example.com'),
      name: 'Test User',
      role: 'USER',
      passwordHash: 'hashed_password',
      isEmailVerified: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...props,
    };
    return new User(defaultProps);
  }
}


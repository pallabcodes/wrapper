import { Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { Email } from '../value-objects/email.vo';
import { Password } from '../value-objects/password.vo';
import { UserId } from '../value-objects/user-id.vo';
import { UserRegisteredEvent, UserEmailVerifiedEvent } from '../events/user-events';
import type { UserRepositoryPort } from '../ports/output/user.repository.port';
import type { AuthConfig } from '../../infrastructure/config/auth.config';

/**
 * Domain Service for User-related business logic
 * Handles complex business rules that span multiple entities
 */
@Injectable()
export class UserDomainService {
  constructor(
    private readonly userRepository: UserRepositoryPort,
  ) {}

  /**
   * Register a new user with business rule validation
   */
  async registerUser(
    email: Email,
    name: string,
    password: string,
    role: string = 'USER'
  ): Promise<User> {
    // Business rule: Check if email is available
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Business rule: Validate role permissions
    if (!this.isValidRole(role)) {
      throw new Error('Invalid user role');
    }

    // Business rule: Check password strength against domain rules
    if (!this.meetsPasswordRequirements(password)) {
      throw new Error('Password does not meet security requirements');
    }

    const user = await User.create(email, name, password, this.getAuthConfig(), role as any);

    // Add domain event for side effects (email sending, etc.)
    user.addDomainEvent(new UserRegisteredEvent(
      user.id,
      email.getValue(),
      name,
      role
    ));

    return user;
  }

  /**
   * Verify user email with business rules
   */
  async verifyUserEmail(userId: UserId, otpCode: string): Promise<User> {
    const user = await this.userRepository.findById(userId.value);
    if (!user) {
      throw new Error('User not found');
    }

    // Business rule: User must be active to verify email
    if (!user.isActive) {
      throw new Error('Cannot verify email for inactive user');
    }

    // Business rule: Email should not already be verified
    if (user.isEmailVerified) {
      throw new Error('Email already verified');
    }

    // Verify OTP (this would typically involve OTP service)
    // For now, we'll assume OTP verification passes

    // Update user and add domain event
    const verifiedUser = await user.verifyEmail();

    verifiedUser.addDomainEvent(new UserEmailVerifiedEvent(
      userId.value,
      user.email.getValue()
    ));

    return verifiedUser;
  }

  /**
   * Check if user can perform action based on role hierarchy
   */
  canUserPerformAction(user: User, requiredRole: string): boolean {
    const roleHierarchy = {
      'USER': 1,
      'MODERATOR': 2,
      'ADMIN': 3
    };

    const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 999;

    return userLevel >= requiredLevel;
  }

  /**
   * Get user permissions based on role
   */
  getUserPermissions(user: User): string[] {
    const rolePermissions = {
      'USER': ['read:profile', 'update:profile'],
      'MODERATOR': ['read:profile', 'update:profile', 'moderate:content'],
      'ADMIN': ['*'] // All permissions
    };

    return rolePermissions[user.role as keyof typeof rolePermissions] || [];
  }

  /**
   * Business rule: Validate role
   */
  private isValidRole(role: string): boolean {
    return ['USER', 'MODERATOR', 'ADMIN'].includes(role);
  }

  /**
   * Business rule: Check password requirements
   */
  private meetsPasswordRequirements(password: string): boolean {
    // Domain-specific password rules
    const passwordValue = password;
    return passwordValue.length >= 8 &&
           /[A-Z]/.test(passwordValue) &&
           /[a-z]/.test(passwordValue) &&
           /\d/.test(passwordValue);
  }

  /**
   * In a real app, inject config; here provide defaults to keep domain pure.
   */
  private getAuthConfig(): AuthConfig {
    return {
      JWT: {
        SECRET: 'unused',
        ACCESS_TOKEN_EXPIRATION: '15m',
        REFRESH_TOKEN_EXPIRATION: '7d',
      },
      BCRYPT: {
        SALT_ROUNDS: 10,
      },
      PASSWORD: {
        MIN_LENGTH: 8,
        REQUIRE_UPPERCASE: true,
        REQUIRE_LOWERCASE: true,
        REQUIRE_NUMBER: true,
      },
    };
  }
}
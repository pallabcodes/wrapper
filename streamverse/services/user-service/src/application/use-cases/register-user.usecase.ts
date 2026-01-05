// ================================
// 📦 FRAMEWORK & EXTERNAL LIBS
// ================================
import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

// ================================
// 🎯 DOMAIN LAYER
// ================================
// Entities - Business objects with identity and lifecycle
import { User, UserRole } from '../../domain/entities/user.entity';

// Value Objects - Immutable value concepts
import { Email } from '../../domain/value-objects/email.vo';
import { Password } from '../../domain/value-objects/password.vo';
import { Username } from '../../domain/value-objects/username.vo';

// Domain Exceptions - Business rule violations
import { DomainException } from '../../domain/exceptions/domain.exception';

// Ports - Dependency contracts for domain services
import {
  IUserRepository,
  USER_REPOSITORY
} from '../../domain/ports/user-repository.port';
import {
  IAuthService,
  AUTH_SERVICE
} from '../../domain/ports/auth-service.port';
import {
  INotificationService,
  NOTIFICATION_SERVICE
} from '../../domain/ports/notification-service.port';

// ================================
// 🛠️ INFRASTRUCTURE LAYER
// ================================
// Infrastructure services - External concerns implementation
import { RedisTokenService } from '../../infrastructure/cache/redis-token.service';

// ================================
// 🏗️ APPLICATION LAYER
// ================================
// Application DTOs - Internal data contracts
import { RegisterUserRequest } from '../dto/register-user-request.dto';
import { UserResponse } from '../dto/user-response.dto';

// Application Mappers - Data transformation
import { UserMapper } from '../mappers/user.mapper';

/**
 * Use Case: Register User
 *
 * Handles user registration business logic
 * Orchestrates domain objects and infrastructure
 */
@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(AUTH_SERVICE)
    private readonly authService: IAuthService,
    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationService: INotificationService,
    private readonly redisTokenService: RedisTokenService,
  ) { }

  async execute(request: RegisterUserRequest): Promise<UserResponse> {
    // 1. Validate and create value objects
    const email = Email.create(request.email);
    const username = Username.create(request.username);
    const password = Password.create(request.password);

    // 2. Determine user role (default to viewer)
    const role = this.parseUserRole(request.role);

    // 3. Check uniqueness constraints
    await this.checkEmailUniqueness(email);
    await this.checkUsernameUniqueness(username);

    // 4. Generate unique user ID
    const userId = await this.generateUserId();

    // 5. Hash password
    const hashedPassword = await password.hash();
    const userWithHashedPassword = User.create(
      userId,
      email,
      username,
      hashedPassword,
      role
    );

    // 6. Save to repository
    await this.userRepository.save(userWithHashedPassword);

    // 7. Send email verification (async, don't wait)
    this.sendVerificationEmail(userWithHashedPassword).catch(error => {
      console.error('Failed to send verification email:', error);
    });

    // 8. Return response
    return UserMapper.toUserResponse(userWithHashedPassword);
  }

  private parseUserRole(role?: string): UserRole {
    if (!role) return UserRole.VIEWER;

    const validRoles = Object.values(UserRole);
    if (validRoles.includes(role as UserRole)) {
      return role as UserRole;
    }

    return UserRole.VIEWER;
  }

  private async checkEmailUniqueness(email: Email): Promise<void> {
    const exists = await this.userRepository.emailExists(email);
    if (exists) {
      throw DomainException.emailAlreadyExists(email.getValue());
    }
  }

  private async checkUsernameUniqueness(username: Username): Promise<void> {
    const exists = await this.userRepository.usernameExists(username);
    if (exists) {
      throw DomainException.usernameAlreadyExists(username.getValue());
    }
  }

  private async generateUserId(): Promise<string> {
    // Generate proper UUID for database compatibility
    return uuidv4();
  }

  private async sendVerificationEmail(user: User): Promise<void> {
    const verificationToken = this.authService.generateSecureToken(32);

    // Store token in Redis with 24-hour expiration for email verification
    await this.storeEmailVerificationToken(user.getId(), verificationToken);

    // Calls notification service interface
    await this.notificationService.sendEmailVerification(
      user.getId(),
      user.getEmail(),
      verificationToken
    );
  }

  private async storeEmailVerificationToken(userId: string, token: string): Promise<void> {
    await this.redisTokenService.storeEmailVerificationToken(userId, token);
  }
}

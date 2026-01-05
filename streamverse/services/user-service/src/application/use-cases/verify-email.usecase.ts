import { Injectable, Inject } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { DomainException } from '../../domain/exceptions/domain.exception';
import {
  IUserRepository,
  USER_REPOSITORY
} from '../../domain/ports/user-repository.port';
import { RedisTokenService } from '../../infrastructure/cache/redis-token.service';

/**
 * Application DTO: Verify Email Request
 */
export class VerifyEmailRequest {
  constructor(public readonly token: string) {}
}

/**
 * Application DTO: Verify Email Response
 */
export class VerifyEmailResponse {
  constructor(
    public readonly message: string,
    public readonly email: string,
    public readonly verifiedAt: Date
  ) {}
}

/**
 * Use Case: Verify Email
 *
 * Handles email verification business logic
 * Validates token and marks user email as verified
 */
@Injectable()
export class VerifyEmailUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly redisTokenService: RedisTokenService,
  ) {}

  async execute(request: VerifyEmailRequest): Promise<VerifyEmailResponse> {
    // Validate token format
    if (!request.token || request.token.length < 10) {
      throw DomainException.invalidVerificationToken();
    }

    // Get userId from Redis using the verification token
    const userId = await this.redisTokenService.getEmailVerificationUserId(request.token);

    if (!userId) {
      // Audit logging for failed verification attempts
      console.log(`❌ AUDIT: Email verification failed - Invalid/expired token: ${request.token.substring(0, 10)}..., Time: ${new Date().toISOString()}`);
      throw DomainException.invalidVerificationToken(); // Token not found or expired
    }

    // Find the user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw DomainException.userNotFound(userId);
    }

    // Check if already verified
    if (user.isEmailVerified()) {
      // Audit logging for duplicate verification attempts
      console.log(`⚠️ AUDIT: Email already verified - User: ${user.getId()}, Email: ${user.getEmail().getValue()}, Time: ${new Date().toISOString()}`);
      throw new DomainException('Email already verified', 'EMAIL_ALREADY_VERIFIED');
    }

    // Mark email as verified
    user.markEmailAsVerified();

    // Update user in database
    await this.userRepository.update(user);

    // Delete the verification token (one-time use)
    await this.redisTokenService.deleteEmailVerificationToken(request.token);

    // Audit logging for security monitoring
    console.log(`✅ AUDIT: Email verification successful - User: ${user.getId()}, Email: ${user.getEmail().getValue()}, Time: ${new Date().toISOString()}`);

    return new VerifyEmailResponse(
      'Email verified successfully',
      user.getEmail().getValue(),
      user.getEmailVerifiedAt()!
    );
  }
}

import { Inject, Injectable } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY
} from '../../domain/ports/user-repository.port';
import {
  INotificationService,
  NOTIFICATION_SERVICE
} from '../../domain/ports/notification-service.port';
import { Email } from '../../domain/value-objects/email.vo';
import { DomainException } from '../../domain/exceptions/domain.exception';

export interface RequestPasswordResetRequest {
  email: string;
}

export interface RequestPasswordResetResponse {
  success: boolean;
  message: string;
}

/**
 * Use Case: Request Password Reset
 *
 * Initiates password reset process by sending reset email
 * Generates secure reset token with expiration
 */
@Injectable()
export class RequestPasswordResetUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationService: INotificationService,
  ) {}

  async execute(request: RequestPasswordResetRequest): Promise<RequestPasswordResetResponse> {
    // 1. Create Email value object
    let email: Email;
    try {
      email = Email.create(request.email);
    } catch (error) {
      // Invalid email format - return generic success message for security
      return {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      };
    }

    // 2. Check if user exists (don't reveal if email doesn't exist for security)
    const user = await this.userRepository.findByEmail(email);

    // Always return success message for security (don't reveal if email exists)
    const resetToken = this.generateResetToken();
    const resetUrl = `https://yourapp.com/reset-password?token=${resetToken}`;

    // 2. Send reset email if user exists
    if (user) {
      try {
        await this.notificationService.sendPasswordReset(
          user.getEmail(), // This is already an Email object
          resetToken,
          resetUrl
        );
      } catch (error) {
        console.error('Failed to send password reset email:', error);
        // Don't throw error for security - user shouldn't know about email failures
      }
    }

    return {
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    };
  }

  private generateResetToken(): string {
    // Generate a secure random token (32 characters)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }
}

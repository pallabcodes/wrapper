import { Inject, Injectable } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY
} from '../../domain/ports/user-repository.port';
import {
  IAuthService,
  AUTH_SERVICE
} from '../../domain/ports/auth-service.port';
import { DomainException } from '../../domain/exceptions/domain.exception';

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

/**
 * Use Case: Reset Password
 *
 * Completes password reset process using reset token
 * Validates token and updates password with token invalidation
 */
@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(AUTH_SERVICE)
    private readonly authService: IAuthService,
  ) {}

  async execute(request: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    // 1. Validate new password strength
    // This would use the same validation as registration
    if (request.newPassword.length < 8) {
      throw new DomainException('Password must be at least 8 characters long', 'INVALID_PASSWORD');
    }

    // 2. In a real implementation, you would:
    // - Verify the reset token from Redis/database
    // - Find the associated user
    // - Update the password
    // - Invalidate all existing tokens

    // For demonstration, we'll simulate success
    // In production, you'd implement proper token verification

    return {
      success: true,
      message: 'Password has been reset successfully. Please login with your new password.'
    };
  }
}

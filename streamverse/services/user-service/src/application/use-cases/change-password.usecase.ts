import { Inject, Injectable } from '@nestjs/common';
import {
  IAuthService,
  AUTH_SERVICE
} from '../../domain/ports/auth-service.port';

export interface ChangePasswordRequest {
  userId: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
  newTokenVersion: number;
}

/**
 * Use Case: Change Password (Token Invalidation)
 *
 * Demonstrates token versioning - when password changes,
 * all existing JWT tokens are invalidated for security
 */
@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(AUTH_SERVICE)
    private readonly authService: IAuthService,
  ) {}

  async execute(request: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    // 1. Increment token version (invalidates all existing tokens)
    const newTokenVersion = await this.authService.incrementTokenVersion(request.userId);

    // 2. Revoke all existing tokens for this user
    await this.authService.revokeAllUserTokens(request.userId);

    return {
      success: true,
      message: 'Password changed successfully. All existing sessions have been invalidated.',
      newTokenVersion
    };
  }
}

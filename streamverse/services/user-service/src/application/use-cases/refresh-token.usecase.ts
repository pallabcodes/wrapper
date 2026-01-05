import { Inject, Injectable } from '@nestjs/common';
import {
  IAuthService,
  AUTH_SERVICE
} from '../../domain/ports/auth-service.port';
import {
  IUserRepository,
  USER_REPOSITORY
} from '../../domain/ports/user-repository.port';
import { DomainException } from '../../domain/exceptions/domain.exception';

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Use Case: Refresh Access Token
 *
 * Handles token refresh with rotation for security
 * Generates new access and refresh tokens, revokes old refresh token
 */
@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(AUTH_SERVICE)
    private readonly authService: IAuthService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    // 1. Verify the refresh token
    const tokenData = await this.authService.verifyToken(request.refreshToken);
    if (!tokenData) {
      throw DomainException.invalidCredentials();
    }

    // 2. Check if this is actually a refresh token (would need additional validation)
    // For now, assume it's valid if token verification passed

    // 2. Check if refresh token is still valid (not revoked)
    const isRevoked = await this.authService.isTokenRevoked(tokenData.jti);
    if (isRevoked) {
      throw DomainException.invalidCredentials();
    }

    // 3. Revoke the old refresh token (rotation)
    await this.authService.revokeToken(tokenData.jti);

    // 4. Load the actual user from database
    const user = await this.userRepository.findById(tokenData.userId);
    if (!user) {
      throw DomainException.userNotFound(tokenData.userId);
    }

    // 5. Check if user account is active and verified
    if (!user.canLogin()) {
      throw DomainException.invalidCredentials();
    }

    // 6. Get current token version for the user
    const currentTokenVersion = await this.authService.getTokenVersion(tokenData.userId);

    // 7. Generate new token pair with current version
    const accessToken = await this.authService.generateAccessToken(user, currentTokenVersion);
    const refreshToken = await this.authService.generateRefreshToken(user, currentTokenVersion);

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600 // 1 hour
    };
  }
}

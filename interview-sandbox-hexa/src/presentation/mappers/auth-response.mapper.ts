import { Injectable } from '@nestjs/common';
import { BaseResponseMapper, ApiResponse } from './base-response.mapper';
import { IUser } from '../../infrastructure/persistence/auth/interfaces/auth.interface';

/**
 * Auth Response DTOs
 */
export interface AuthUserDto {
  id: string;
  email: string;
  roles?: string[];
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponseDto extends AuthTokensDto {
  user: AuthUserDto;
}

export interface TwoFactorSetupDto {
  secret: string;
  qrCodeUrl: string;
}

export interface RefreshTokenResponseDto {
  accessToken: string;
}

/**
 * Auth Response Mapper
 * 
 * Maps authentication-related responses from domain/application layer
 * to presentation layer DTOs
 */
@Injectable()
export class AuthResponseMapper extends BaseResponseMapper {
  /**
   * Map user entity to AuthUserDto
   */
  toAuthUserDto(user: IUser): AuthUserDto {
    return {
      id: user.id,
      email: user.email,
      roles: user.roles ? [...user.roles] : undefined,
    };
  }

  /**
   * Map to registration response (201 Created)
   */
  toRegisterResponse(user: IUser, tokens: { accessToken: string; refreshToken: string }, requestId?: string): ApiResponse<AuthResponseDto> {
    return this.created<AuthResponseDto>(
      {
        user: this.toAuthUserDto(user),
        ...tokens,
      },
      'User registered successfully',
      requestId,
    );
  }

  /**
   * Map to login response (200 OK)
   */
  toLoginResponse(user: IUser, tokens: { accessToken: string; refreshToken: string }, requestId?: string): ApiResponse<AuthResponseDto> {
    return this.success<AuthResponseDto>(
      {
        user: this.toAuthUserDto(user),
        ...tokens,
      },
      'Login successful',
      requestId,
    );
  }

  /**
   * Map to refresh token response (200 OK)
   */
  toRefreshTokenResponse(accessToken: string, requestId?: string): ApiResponse<RefreshTokenResponseDto> {
    return this.success<RefreshTokenResponseDto>(
      { accessToken },
      'Token refreshed successfully',
      requestId,
    );
  }

  /**
   * Map to logout response (200 OK)
   */
  toLogoutResponse(requestId?: string): ApiResponse<{ message: string }> {
    return this.success<{ message: string }>(
      { message: 'Logged out successfully' },
      'Logged out successfully',
      requestId,
    );
  }

  /**
   * Map to profile response (200 OK)
   */
  toProfileResponse(user: IUser, requestId?: string): ApiResponse<AuthUserDto> {
    return this.success<AuthUserDto>(
      this.toAuthUserDto(user),
      'Profile retrieved successfully',
      requestId,
    );
  }

  /**
   * Map to 2FA setup response (200 OK)
   */
  toTwoFactorSetupResponse(secret: string, qrCodeUrl: string, requestId?: string): ApiResponse<TwoFactorSetupDto> {
    return this.success<TwoFactorSetupDto>(
      { secret, qrCodeUrl },
      '2FA setup completed successfully',
      requestId,
    );
  }

  /**
   * Map to 2FA verify response (200 OK)
   */
  toTwoFactorVerifyResponse(requestId?: string): ApiResponse<{ message: string }> {
    return this.success<{ message: string }>(
      { message: '2FA verified successfully' },
      '2FA verified successfully',
      requestId,
    );
  }

  /**
   * Map to Google OAuth response (200 OK)
   */
  toGoogleOAuthResponse(user: IUser, tokens: { accessToken: string; refreshToken: string }, requestId?: string): ApiResponse<AuthResponseDto> {
    return this.success<AuthResponseDto>(
      {
        user: this.toAuthUserDto(user),
        ...tokens,
      },
      'Google OAuth authentication successful',
      requestId,
    );
  }
}


import { Injectable } from '@nestjs/common';
import { BaseResponseMapper } from '@common/mappers/base-response-mapper';

/**
 * AuthResponseMapper
 * 
 * Maps auth-related domain entities/DTOs to API response format.
 * 
 * Use this mapper in AuthController to ensure consistent response formats
 * and easy matching of expected response formats (assignments, API contracts).
 */
@Injectable()
export class AuthResponseMapper extends BaseResponseMapper<any, any> {
  /**
   * Transform user registration response
   */
  toRegisterResponse(data: {
    user: any;
    tokens: { accessToken: string; refreshToken: string };
    otp?: { code: string; expiresAt: Date };
  }) {
    return {
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          isEmailVerified: data.user.isEmailVerified,
        },
        tokens: {
          accessToken: data.tokens.accessToken,
          refreshToken: data.tokens.refreshToken,
        },
        ...(data.otp && {
          otp: {
            code: data.otp.code,
            expiresAt: data.otp.expiresAt,
          },
        }),
      },
    };
  }

  /**
   * Transform login response
   */
  toLoginResponse(data: {
    user: any;
    tokens: { accessToken: string; refreshToken: string };
  }) {
    return {
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          isEmailVerified: data.user.isEmailVerified,
        },
        tokens: {
          accessToken: data.tokens.accessToken,
          refreshToken: data.tokens.refreshToken,
        },
      },
    };
  }

  /**
   * Transform OAuth callback response
   */
  toOAuthResponse(data: {
    user: { id: number; email: string; name: string };
    tokens: { accessToken: string; refreshToken: string };
  }) {
    return {
      success: true,
      message: 'Authentication successful',
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
        },
        tokens: {
          accessToken: data.tokens.accessToken,
          refreshToken: data.tokens.refreshToken,
        },
      },
    };
  }

  /**
   * Transform current user response
   */
  toCurrentUserResponse(user: any) {
    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  /**
   * Transform token refresh response
   */
  toRefreshTokenResponse(tokens: { accessToken: string; refreshToken: string } | { tokens: { accessToken: string; refreshToken: string } }) {
    // Handle both formats: direct tokens or wrapped in tokens property
    const tokenData = 'tokens' in tokens ? tokens.tokens : tokens;
    
    return {
      success: true,
      message: 'Tokens refreshed successfully',
      data: {
        tokens: {
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
        },
      },
    };
  }

  /**
   * Transform success message response (for verify, resend, etc.)
   */
  toSuccessMessageResponse(message: string, data?: any) {
    return {
      success: true,
      message,
      ...(data && { data }),
    };
  }

  /**
   * Default implementation (fallback)
   */
  toResponse(domain: any): any {
    return {
      success: true,
      data: domain,
    };
  }

  /**
   * CREATE response (for registration)
   */
  toCreateResponse(domain: any): any {
    if (domain.user && domain.tokens) {
      return this.toRegisterResponse(domain);
    }
    return this.toResponse(domain);
  }

  /**
   * READ response (for get current user)
   */
  toReadResponse(domain: any): any {
    if (domain.id && domain.email) {
      return this.toCurrentUserResponse(domain);
    }
    return this.toResponse(domain);
  }
}


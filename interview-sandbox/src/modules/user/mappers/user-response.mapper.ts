import { Injectable } from '@nestjs/common';
import { BaseResponseMapper } from '@common/mappers/base-response-mapper';

/**
 * UserResponseMapper
 * 
 * Maps user-related domain entities/DTOs to API response format.
 */
@Injectable()
export class UserResponseMapper extends BaseResponseMapper<any, any> {
  /**
   * Transform user profile response
   */
  toProfileResponse(user: any) {
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
   * Default implementation
   */
  toResponse(domain: any): any {
    return this.toProfileResponse(domain);
  }

  /**
   * READ response (GET /users/me)
   */
  toReadResponse(domain: any): any {
    return this.toProfileResponse(domain);
  }

  /**
   * UPDATE response (PUT /users/me)
   */
  toUpdateResponse(domain: any): any {
    return {
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: domain.id,
        email: domain.email,
        name: domain.name,
        phone: domain.phone,
        isEmailVerified: domain.isEmailVerified,
        updatedAt: domain.updatedAt,
      },
    };
  }
}


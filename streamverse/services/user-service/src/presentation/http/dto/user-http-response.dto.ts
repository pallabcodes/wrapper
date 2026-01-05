import { UserRole, UserStatus } from '../../../domain/entities/user.entity';
import { UserResponse } from '../../../application/dto/user-response.dto';

/**
 * Presentation DTO: HTTP User Response
 *
 * External HTTP API response format
 * What clients receive from the API
 */
export class UserHttpResponse {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly username: string,
    public readonly role: UserRole,
    public readonly status: UserStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly emailVerifiedAt?: Date,
    public readonly lastLoginAt?: Date
  ) {}

  static fromAppDto(appDto: UserResponse): UserHttpResponse {
    return new UserHttpResponse(
      appDto.id,
      appDto.email,
      appDto.username,
      appDto.role,
      appDto.status,
      appDto.createdAt,
      appDto.updatedAt,
      appDto.emailVerifiedAt,
      appDto.lastLoginAt
    );
  }
}

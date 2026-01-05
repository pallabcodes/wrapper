import { UserRole, UserStatus } from '../../domain/entities/user.entity';

/**
 * Application DTO: User Response
 *
 * Internal response containing user information
 * Used between application and presentation layers
 */
export class UserResponse {
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
}

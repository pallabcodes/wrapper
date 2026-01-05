import { User } from '../../domain/entities/user.entity';
import { UserResponse } from '../dto/user-response.dto';

/**
 * Mapper: Domain User → Application DTOs
 *
 * Converts domain entities to application DTOs
 * Handles data transformation between layers
 */
export class UserMapper {
  static toUserResponse(user: User): UserResponse {
    return new UserResponse(
      user.getId(),
      user.getEmail().getValue(),
      user.getUsername().getValue(),
      user.getRole(),
      user.getStatus(),
      user.getCreatedAt(),
      user.getUpdatedAt(),
      user.getEmailVerifiedAt(),
      user.getLastLoginAt()
    );
  }

  static toUserResponses(users: User[]): UserResponse[] {
    return users.map(user => this.toUserResponse(user));
  }
}

import { User } from '@domain/entities/user.entity';
import { UserDto } from '../dto/user.dto';

export class UserMapper {
  static toDto(user: User): UserDto {
    return new UserDto(
      user.id,
      user.email.getValue(),
      user.name,
      user.role,
      user.isEmailVerified,
    );
  }
}


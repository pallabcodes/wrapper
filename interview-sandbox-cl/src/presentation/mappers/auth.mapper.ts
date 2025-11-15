import { RegisterUserRequestDto } from '../dto/register-user.request.dto';
import { LoginUserRequestDto } from '../dto/login-user.request.dto';
import { UserResponseDto } from '../dto/user.response.dto';
import { RegisterUserDto } from '@application/dto/register-user.dto';
import { LoginUserDto } from '@application/dto/login-user.dto';
import { UserDto } from '@application/dto/user.dto';

export class AuthMapper {
  static toRegisterDto(request: RegisterUserRequestDto): RegisterUserDto {
    return new RegisterUserDto(
      request.email,
      request.name,
      request.password,
      request.role,
    );
  }

  static toLoginDto(request: LoginUserRequestDto): LoginUserDto {
    return new LoginUserDto(request.email, request.password);
  }

  static toUserResponseDto(dto: UserDto): UserResponseDto {
    return {
      id: dto.id,
      email: dto.email,
      name: dto.name,
      role: dto.role,
      isEmailVerified: dto.isEmailVerified,
    };
  }
}


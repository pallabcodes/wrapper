import { Injectable, Inject } from '@nestjs/common';
import { Email } from '@domain/value-objects/email.vo';
import { Password } from '@domain/value-objects/password.vo';
import type { UserRepositoryPort } from '@domain/ports/output/user.repository.port';
import { USER_REPOSITORY_PORT } from '@domain/ports/output/user.repository.port';
import { InvalidCredentialsException } from '@domain/exceptions/invalid-credentials.exception';
import { LoginUserDto } from '../dto/login-user.dto';
import { UserDto } from '../dto/user.dto';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class LoginUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(dto: LoginUserDto): Promise<UserDto> {
    // 1. Create value objects
    const email = Email.create(dto.email);
    const password = Password.create(dto.password);

    // 2. Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new InvalidCredentialsException();
    }

    // 3. Verify password
    if (!password.compare(user.passwordHash)) {
      throw new InvalidCredentialsException();
    }

    // 4. Return user DTO
    return UserMapper.toDto(user);
  }
}


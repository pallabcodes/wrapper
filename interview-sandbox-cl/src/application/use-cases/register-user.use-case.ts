import { Injectable, Inject } from '@nestjs/common';
import { User } from '@domain/entities/user.entity';
import { Email } from '@domain/value-objects/email.vo';
import { Password } from '@domain/value-objects/password.vo';
import type { UserRepositoryPort } from '@domain/ports/output/user.repository.port';
import { USER_REPOSITORY_PORT } from '@domain/ports/output/user.repository.port';
import { UserAlreadyExistsException } from '@domain/exceptions/user-already-exists.exception';
import { RegisterUserDto } from '../dto/register-user.dto';
import { UserDto } from '../dto/user.dto';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(dto: RegisterUserDto): Promise<UserDto> {
    // 1. Create value objects
    const email = Email.create(dto.email);
    const password = Password.create(dto.password);

    // 2. Check if user already exists
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new UserAlreadyExistsException(dto.email);
    }

    // 3. Create user entity (domain logic)
    const user = User.create(email, dto.name, password, dto.role);

    // 4. Save user (via port)
    const saved = await this.userRepository.save(user);

    // 5. Return DTO
    return UserMapper.toDto(saved);
  }
}


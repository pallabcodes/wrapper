import { Injectable, Inject } from '@nestjs/common';
import { Email } from '@domain/value-objects/email.vo';
import { Password } from '@domain/value-objects/password.vo';
import type { UserRepositoryPort } from '@domain/ports/output/user.repository.port';
import { USER_REPOSITORY_PORT } from '@domain/ports/output/user.repository.port';
import { InvalidCredentialsException } from '@domain/exceptions/invalid-credentials.exception';
import { LoginUserDto } from '../dto/login-user.dto';
import { UserDto } from '../dto/user.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { UserMapper } from '../mappers/user.mapper';
import { JwtService } from '../../infrastructure/auth/jwt.service';
import { createAuthConfig } from '../../infrastructure/config/auth.config';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LoginUserUseCase {
  private readonly authConfig;

  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.authConfig = createAuthConfig(configService);
  }

  async execute(dto: LoginUserDto): Promise<AuthResponseDto> {
    // 1. Create value objects
    const email = Email.create(dto.email);

    // 2. Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.isAccountActive()) {
      throw new InvalidCredentialsException();
    }

    // 3. Verify password against stored hash
    const password = Password.fromHash(user.passwordHash, this.authConfig);
    const isValidPassword = await password.compare(dto.password);
    if (!isValidPassword) {
      throw new InvalidCredentialsException();
    }

    // 4. Generate JWT tokens
    const tokens = await this.jwtService.generateTokens(user.id, user.email.getValue(), user.role);

    // 5. Return auth response with user and tokens
    const userDto = UserMapper.toDto(user);
    return new AuthResponseDto(userDto, tokens);
  }
}


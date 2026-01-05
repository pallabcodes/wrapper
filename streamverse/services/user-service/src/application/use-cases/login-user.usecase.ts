import { Inject, Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { Username } from '../../domain/value-objects/username.vo';
import { Password } from '../../domain/value-objects/password.vo';
import { DomainException } from '../../domain/exceptions/domain.exception';
import {
  IUserRepository,
  USER_REPOSITORY
} from '../../domain/ports/user-repository.port';
import {
  IAuthService,
  AUTH_SERVICE
} from '../../domain/ports/auth-service.port';
import { LoginRequest } from '../dto/login-request.dto';
import { LoginResponse } from '../dto/login-response.dto';
import { UserMapper } from '../mappers/user.mapper';

/**
 * Use Case: Login User
 *
 * Handles user authentication business logic
 */
@Injectable()
export class LoginUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(AUTH_SERVICE)
    private readonly authService: IAuthService,
  ) { }

  async execute(request: LoginRequest): Promise<LoginResponse> {
    // 1. Find user by email or username
    const user = await this.findUserByEmailOrUsername(request.emailOrUsername);
    if (!user) {
      throw DomainException.invalidCredentials();
    }

    // 2. Check if account is locked
    if (user.isAccountLocked()) {
      throw DomainException.accountLocked();
    }

    // 3. Verify password
    const isPasswordValid = await this.verifyPassword(
      request.password,
      user.getPassword()
    );
    if (!isPasswordValid) {
      // Record failed login attempt
      const accountLocked = user.recordFailedLogin();
      await this.userRepository.update(user);

      if (accountLocked) {
        throw DomainException.accountLocked();
      } else {
        throw DomainException.invalidCredentials();
      }
    }

    // 4. Clear failed login attempts on successful login
    if (user.getFailedLoginAttempts() > 0) {
      user.clearFailedLoginAttempts();
    }

    // 5. Check if user can login
    if (!user.canLogin()) {
      if (!user.isEmailVerified()) {
        throw DomainException.userNotVerified();
      }
      throw new DomainException('Account is not active');
    }

    // 4. Record login
    user.recordLogin();
    await this.userRepository.update(user);

    // 5. Generate tokens
    const accessToken = await this.authService.generateAccessToken(user);
    const refreshToken = await this.authService.generateRefreshToken(user);

    // 6. Return response
    const userResponse = UserMapper.toUserResponse(user);
    return new LoginResponse(
      userResponse,
      accessToken,
      refreshToken,
      3600 // 1 hour expiration
    );
  }

  private async findUserByEmailOrUsername(emailOrUsername: string): Promise<User | null> {
    // Try email first
    try {
      const email = Email.create(emailOrUsername);
      const user = await this.userRepository.findByEmail(email);
      if (user) return user;
    } catch {
      // Not a valid email, continue to username check
    }

    // Try username
    try {
      const username = Username.create(emailOrUsername);
      const user = await this.userRepository.findByUsername(username);
      if (user) return user;
    } catch {
      // Not a valid username either
    }

    return null;
  }

  private async verifyPassword(
    plainPassword: string,
    userPassword: Password
  ): Promise<boolean> {
    return await this.authService.verifyPassword(
      plainPassword,
      userPassword.getValue()
    );
  }
}

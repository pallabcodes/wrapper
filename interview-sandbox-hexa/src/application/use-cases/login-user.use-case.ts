import { Injectable, Inject } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { Password } from '../../domain/value-objects/password.vo';
import { IUserRepository } from '../../domain/ports/output/user-repository.port';
import { ILoginUserUseCase, LoginUserDto, AuthResult } from '../../domain/ports/input/auth-use-cases.port';

@Injectable()
export class LoginUserUseCase implements ILoginUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(dto: LoginUserDto): Promise<AuthResult> {
    // Find user by email
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password using domain logic
    const password = Password.create(dto.password);
    const isPasswordValid = await user.verifyPassword(password);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens (infrastructure concern - simplified for demo)
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  // Simplified token generation - in real app, use JWT service
  private generateAccessToken(user: User): string {
    return `access_token_${user.id}_${Date.now()}`;
  }

  private generateRefreshToken(user: User): string {
    return `refresh_token_${user.id}_${Date.now()}`;
  }
}

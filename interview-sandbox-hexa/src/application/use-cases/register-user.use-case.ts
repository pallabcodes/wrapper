import { Injectable, Inject } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { Password } from '../../domain/value-objects/password.vo';
import { UserRole } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/ports/output/user-repository.port';
import { IRegisterUserUseCase, RegisterUserDto, AuthResult } from '../../domain/ports/input/auth-use-cases.port';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RegisterUserUseCase implements IRegisterUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(dto: RegisterUserDto): Promise<AuthResult> {
    // Business logic validation - check if user already exists
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new Error(`User with email ${dto.email} already exists`);
    }

    // Create domain objects
    const userId = uuidv4();
    const email = Email.create(dto.email);
    const password = Password.create(dto.password);
    const role = (dto.role as UserRole) || 'USER';

    // Create user entity using factory method
    const user = await User.create(userId, email, dto.name, password, role);

    // Persist user through repository port
    const savedUser = await this.userRepository.save(user);

    // Generate tokens (infrastructure concern - simplified for demo)
    const accessToken = this.generateAccessToken(savedUser);
    const refreshToken = this.generateRefreshToken(savedUser);

    return {
      user: savedUser,
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

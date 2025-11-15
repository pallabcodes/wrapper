/**
 * Application Service: Auth Service
 * 
 * Orchestrates domain logic
 * Depends on Ports (interfaces), not implementations
 * 
 * This is the "Use Case" layer in Hexagonal Architecture
 */
import { Injectable, ConflictException, UnauthorizedException, Inject } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '@domain/entities/user.entity';
import type { UserRepositoryPort } from '@domain/ports/user.repository.port';
import { USER_REPOSITORY_PORT } from '@domain/ports/user.repository.port';
import type { EventPublisherPort } from '@domain/ports/event.publisher.port';
import { EVENT_PUBLISHER_PORT } from '@domain/ports/event.publisher.port';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { UserRegisteredEvent } from '../events/user.registered.event';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
    @Inject(EVENT_PUBLISHER_PORT)
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  async register(dto: RegisterDto): Promise<{ user: User; accessToken: string }> {
    // Check if user exists (business rule)
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Create domain entity
    const user = new User(
      this.generateId(),
      dto.email,
      dto.name,
      passwordHash,
      false, // Not verified yet
    );

    // Save user
    const savedUser = await this.userRepository.save(user);

    // Publish domain event (async, non-blocking)
    await this.eventPublisher.publish(
      'user.registered',
      new UserRegisteredEvent(savedUser.id, savedUser.email, savedUser.name),
    );

    // Generate token (simplified for demo)
    const accessToken = this.generateToken(savedUser.id);

    return { user: savedUser, accessToken };
  }

  async login(dto: LoginDto): Promise<{ user: User; accessToken: string }> {
    // Find user
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Business rule: Check if user can login
    if (!user.canLogin()) {
      throw new UnauthorizedException('Email not verified');
    }

    // Generate token
    const accessToken = this.generateToken(user.id);

    return { user, accessToken };
  }

  async verifyEmail(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Domain method: Verify email
    const verifiedUser = user.verifyEmail();

    // Save updated user
    return this.userRepository.update(userId, verifiedUser);
  }

  private generateId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  private generateToken(userId: string): string {
    // Simplified token generation (in real app, use JWT)
    return `token_${userId}_${Date.now()}`;
  }
}


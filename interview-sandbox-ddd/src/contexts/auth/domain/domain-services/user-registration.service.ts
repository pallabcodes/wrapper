import { Injectable, Inject } from '@nestjs/common';
import { UserAggregate } from '../aggregates/user.aggregate';
import { Email } from '../value-objects/email.vo';
import { Password } from '../value-objects/password.vo';
import { UserRole } from '../entities/user.entity';
import { IUserRepository } from '../repositories/user.repository.interface';

@Injectable()
export class UserRegistrationDomainService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async registerUser(
    userId: string,
    email: string,
    name: string,
    password: string,
    role: UserRole = 'USER'
  ): Promise<UserAggregate> {
    // Domain validation - check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error(`User with email ${email} already exists`);
    }

    // Business rules validation
    this.validateUserRegistrationData(name, role);

    // Create value objects
    const emailVO = Email.create(email);
    const passwordVO = Password.create(password);

    // Create aggregate - this encapsulates the entity and handles domain events
    const userAggregate = await UserAggregate.create(userId, emailVO, name, passwordVO, role);

    return userAggregate;
  }

  async verifyUserEmail(userId: string): Promise<void> {
    const userAggregate = await this.userRepository.findById(userId);
    if (!userAggregate) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Business logic for email verification
    userAggregate.verifyEmail();

    // Save the updated aggregate
    await this.userRepository.save(userAggregate);
  }

  private validateUserRegistrationData(name: string, role: UserRole): void {
    // Business rule: Name must be at least 2 characters
    if (!name || name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }

    // Business rule: Only admin can create admin users
    if (role === 'ADMIN') {
      // In a real application, this would check the current user's role
      // For now, we'll allow it but log a warning
      console.warn('Creating admin user - ensure proper authorization');
    }
  }
}

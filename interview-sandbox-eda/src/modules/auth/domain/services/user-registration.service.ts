import { Injectable, Inject } from '@nestjs/common';
import { UserAggregate, UserRole } from '../aggregates/user.aggregate';
import { Email } from '../value-objects/email.vo';
import { Password } from '../value-objects/password.vo';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class UserRegistrationService {
  constructor(
    @Inject('USER_REPOSITORY')
    private readonly userRepository: UserRepository,
  ) { }

  async registerUser(
    userId: string,
    email: string,
    name: string,
    password: string,
    role: UserRole = 'USER'
  ): Promise<UserAggregate> {
    // Validate input
    const emailVO = Email.create(email);
    const passwordVO = Password.create(password);

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(emailVO.getValue());
    if (existingUser) {
      throw new Error(`User with email ${email} already exists`);
    }

    // Create aggregate - this will publish domain events
    const user = await UserAggregate.register(userId, emailVO, name, passwordVO, role);

    // Save aggregate to repository
    await this.userRepository.save(user);

    // Return the aggregate (domain events will be published by infrastructure)
    return user;
  }

  async verifyUserEmail(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Business logic for email verification
    user.verifyEmail();

    // Save updated aggregate
    await this.userRepository.save(user);
  }
}

import { Injectable, Inject } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { UserRegistrationService } from '../../domain/services/user-registration.service';
import { UserRepository } from '../../domain/repositories/user.repository';
import { RegisterUserCommand } from '../commands/register-user.command';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRegistrationService: UserRegistrationService,
    @Inject('USER_REPOSITORY')
    private readonly userRepository: UserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async registerUser(command: RegisterUserCommand): Promise<string> {
    try {
      const user = await this.userRegistrationService.registerUser(
        command.userId,
        command.email,
        command.name,
        command.password,
        command.role
      );

      // Publish domain events to the event bus
      const domainEvents = user.getDomainEvents();
      for (const event of domainEvents) {
        await this.eventBus.publish(event);
      }

      // Clear events after publishing
      user.clearDomainEvents();

      return command.userId;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }

  async verifyUserEmail(userId: string): Promise<void> {
    await this.userRegistrationService.verifyUserEmail(userId);
  }

  async getUserById(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return null;
    }

    return {
      id: user.getId(),
      email: user.email.getValue(),
      name: user.name,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

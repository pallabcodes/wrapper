import { Injectable, Inject } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { UserRegistrationDomainService } from '../../domain/domain-services/user-registration.service';
import { UserAggregate } from '../../domain/aggregates/user.aggregate';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { UserRole } from '../../domain/entities/user.entity';

export interface RegisterUserCommand {
  userId: string;
  email: string;
  name: string;
  password: string;
  role?: UserRole;
}

export interface RegisterUserResult {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  isEmailVerified: boolean;
}

@Injectable()
export class RegisterUserUseCase {
  constructor(
    private readonly userRegistrationDomainService: UserRegistrationDomainService,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RegisterUserCommand): Promise<RegisterUserResult> {
    try {
      // Call domain service to handle business logic
      const userAggregate = await this.userRegistrationDomainService.registerUser(
        command.userId,
        command.email,
        command.name,
        command.password,
        command.role || 'USER'
      );

      // Save the aggregate (infrastructure concern)
      await this.userRepository.save(userAggregate);

      // Publish domain events (application concern)
      const domainEvents = userAggregate.getDomainEvents();
      for (const event of domainEvents) {
        await this.eventBus.publish(event);
      }

      // Clear events after publishing
      userAggregate.clearDomainEvents();

      // Return application result
      return {
        userId: userAggregate.id,
        email: userAggregate.email.getValue(),
        name: userAggregate.name,
        role: userAggregate.role,
        isEmailVerified: userAggregate.isEmailVerified,
      };
    } catch (error) {
      console.error('Error in RegisterUserUseCase:', error);
      throw error;
    }
  }
}

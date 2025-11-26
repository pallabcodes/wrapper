import { Injectable } from '@nestjs/common';
import { User } from '../../entities/user.entity';
import { UserDomainService } from '../../services/user-domain.service';
import {
  RegisterUserCommand,
  VerifyUserEmailCommand,
  ChangeUserPasswordCommand,
  UpdateUserProfileCommand,
  DeactivateUserCommand
} from '../commands/user-commands';
import type { UserRepositoryPort } from '../../ports/output/user.repository.port';

/**
 * Command Handlers for CQRS write operations
 * Handle business logic for state-changing operations
 */

@Injectable()
export class RegisterUserCommandHandler {
  constructor(
    private readonly userDomainService: UserDomainService,
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(command: RegisterUserCommand): Promise<User> {
    // Use domain service for complex business logic
    const user = await this.userDomainService.registerUser(
      command.email,
      command.name,
      command.password,
      command.role
    );

    // Save aggregate (this will also publish domain events)
    const savedUser = await this.userRepository.save(user);

    return savedUser;
  }
}

@Injectable()
export class VerifyUserEmailCommandHandler {
  constructor(
    private readonly userDomainService: UserDomainService,
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(command: VerifyUserEmailCommand): Promise<User> {
    // Use domain service for business logic
    const verifiedUser = await this.userDomainService.verifyUserEmail(
      command.userId,
      command.otpCode
    );

    // Update aggregate
    const savedUser = await this.userRepository.update(verifiedUser);

    return savedUser;
  }
}

@Injectable()
export class ChangeUserPasswordCommandHandler {
  constructor(
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(command: ChangeUserPasswordCommand): Promise<User> {
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Change password (this would add domain event)
    const updatedUser = await user.changePassword(command.newPassword, {
      MIN_LENGTH: 8,
      REQUIRE_UPPERCASE: true,
      REQUIRE_LOWERCASE: true,
      REQUIRE_NUMBER: true,
    });

    // Save updated aggregate
    return await this.userRepository.update(updatedUser);
  }
}

@Injectable()
export class UpdateUserProfileCommandHandler {
  constructor(
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(command: UpdateUserProfileCommand): Promise<User> {
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Update profile (business logic would go here)
    // For now, this is a simple update
    const updatedUser = user; // In real implementation, this would be a proper update

    return await this.userRepository.update(updatedUser);
  }
}

@Injectable()
export class DeactivateUserCommandHandler {
  constructor(
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(command: DeactivateUserCommand): Promise<User> {
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Deactivate user (this would add domain event)
    const deactivatedUser = user; // In real implementation, this would deactivate the user

    return await this.userRepository.update(deactivatedUser);
  }
}
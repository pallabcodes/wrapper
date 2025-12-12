import { Injectable, Inject } from '@nestjs/common';
import { User } from '@domain/entities/user.entity';
import { Email } from '@domain/value-objects/email.vo';
import { Password } from '@domain/value-objects/password.vo';
import { UserId } from '@domain/value-objects/user-id.vo';

// CQRS imports
import { RegisterUserCommand } from '@domain/cqrs/commands/user-commands';
import { GetUserByEmailQuery } from '@domain/cqrs/queries/user-queries';
import { RegisterUserCommandHandler } from '@domain/cqrs/handlers/user-command-handlers';
import { GetUserByEmailQueryHandler } from '@domain/cqrs/handlers/user-query-handlers';

// Domain events
import { DomainEventDispatcher } from '@domain/events/domain-event-dispatcher';

// Application DTOs
import { RegisterUserDto } from '../dto/register-user.dto';
import { UserDto } from '../dto/user.dto';
import { UserMapper } from '../mappers/user.mapper';

/**
 * Application Service - CQRS Command/Query Orchestrator
 *
 * This service orchestrates complex use cases by:
 * 1. Coordinating CQRS commands and queries
 * 2. Managing domain events
 * 3. Handling cross-cutting concerns (logging, validation, etc.)
 * 4. Providing transactional boundaries
 */
@Injectable()
export class UserApplicationService {
  constructor(
    private readonly registerUserCommandHandler: RegisterUserCommandHandler,
    private readonly getUserByEmailQueryHandler: GetUserByEmailQueryHandler,
    @Inject(DomainEventDispatcher)
    private readonly eventDispatcher: DomainEventDispatcher,
  ) {}

  /**
   * Register User Use Case - Full CQRS orchestration
   */
  async registerUser(dto: RegisterUserDto): Promise<UserDto> {
    console.log(`🚀 Starting user registration for ${dto.email}`);

    try {
      // 1. Validate input (could be done with pipes, but showing here)
      this.validateRegistrationInput(dto);

      // 2. Create domain objects
      const email = Email.create(dto.email);
      // Password requires auth config; application layer should not build it directly.
      // Leave password creation to the domain service/command handler.

      // 3. Check if user exists (read model)
      const existingUserQuery = new GetUserByEmailQuery(email);
      const existingUser = await this.getUserByEmailQueryHandler.execute(existingUserQuery);

      if (existingUser) {
        throw new Error('User already exists');
      }

      // 4. Execute registration command (write model)
      const registerCommand = new RegisterUserCommand(email, dto.name, dto.password, dto.role);
      const registeredUser = await this.registerUserCommandHandler.execute(registerCommand);

      // 5. Publish domain events (async side effects)
      await this.publishDomainEvents(registeredUser);

      // 6. Return DTO (presentation layer)
      const userDto = UserMapper.toDto(registeredUser);

      console.log(`✅ User registration completed for ${dto.email}`);
      return userDto;

    } catch (error) {
      console.error(`❌ User registration failed for ${dto.email}:`, error);
      throw error;
    }
  }

  /**
   * Get User by Email - CQRS Query
   */
  async getUserByEmail(email: string): Promise<UserDto | null> {
    const emailVO = Email.create(email);
    const query = new GetUserByEmailQuery(emailVO);
    const user = await this.getUserByEmailQueryHandler.execute(query);

    return user ? UserMapper.toDto(user) : null;
  }

  /**
   * Validate registration input (application-level validation)
   */
  private validateRegistrationInput(dto: RegisterUserDto): void {
    if (!dto.email || !dto.password || !dto.name) {
      throw new Error('Email, password, and name are required');
    }

    if (dto.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(dto.password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }

    // Additional application-level validations...
  }

  /**
   * Publish domain events from aggregate
   */
  private async publishDomainEvents(aggregate: User): Promise<void> {
    if (aggregate.hasUncommittedEvents()) {
      const events = aggregate.domainEventsQueue;
      console.log(`📢 Publishing ${events.length} domain events`);

      await this.eventDispatcher.publishAll(events);
      aggregate.markAsCommitted();
    }
  }

  /**
   * Complex business transaction example
   * Demonstrates saga-like orchestration
   */
  async complexUserOperation(userId: string): Promise<void> {
    console.log(`🔄 Starting complex operation for user ${userId}`);

    // This could involve multiple commands, queries, and event handling
    // - Update user profile
    // - Send notifications
    // - Update related aggregates
    // - Handle failures with compensation

    console.log(`✅ Complex operation completed for user ${userId}`);
  }
}
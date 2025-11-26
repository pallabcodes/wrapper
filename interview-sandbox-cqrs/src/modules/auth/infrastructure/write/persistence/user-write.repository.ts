import { Injectable, Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserAggregate } from '../../../write/aggregates/user.aggregate';
import { RegisterUserCommand } from '../../../commands/register-user/register-user.command';
import { WRITE_REPOSITORY_TOKEN, EVENT_BUS_TOKEN } from '../../../../../common/di/tokens';

/**
 * Write Repository Interface
 */
export interface IUserWriteRepository {
  save(aggregate: UserAggregate): Promise<void>;
  findById(id: string): Promise<UserAggregate | null>;
  findByEmail(email: string): Promise<UserAggregate | null>;
}

/**
 * Write Repository Implementation
 *
 * Demonstrates Symbol token injection in CQRS write side
 * Handles event-sourced aggregates
 */
@Injectable()
export class SequelizeUserWriteRepository implements IUserWriteRepository {
  constructor(
    @Inject(EVENT_BUS_TOKEN)
    private readonly eventBus: any,
  ) {}

  async save(aggregate: UserAggregate): Promise<void> {
    // In CQRS write side, we save events, not current state
    const events = aggregate.getUncommittedChanges();

    for (const event of events) {
      // Save event to event store
      console.log('Saving event to event store:', event);
      await this.eventBus.publish(event);
    }

    aggregate.markChangesAsCommitted();
  }

  async findById(id: string): Promise<UserAggregate | null> {
    // In CQRS, write side typically doesn't do reads
    // This would be handled by loading from event store
    console.log('Loading aggregate from event store:', id);
    return null;
  }

  async findByEmail(email: string): Promise<UserAggregate | null> {
    // In CQRS, write side typically doesn't do reads
    // This would be handled by read side
    console.log('Checking email uniqueness:', email);
    return null;
  }
}

/**
 * CQRS Command Handler using Symbol-injected repository
 */
@CommandHandler(RegisterUserCommand)
@Injectable()
export class RegisterUserCommandHandler implements ICommandHandler<RegisterUserCommand> {
  constructor(
    @Inject(WRITE_REPOSITORY_TOKEN)
    private readonly userRepository: IUserWriteRepository,
  ) {}

  async execute(command: RegisterUserCommand): Promise<string> {
    // In a full implementation, this would:
    // 1. Load existing aggregate (if updating)
    // 2. Execute business logic
    // 3. Save events

    console.log('Processing register user command:', command);
    return command.userId;
  }
}


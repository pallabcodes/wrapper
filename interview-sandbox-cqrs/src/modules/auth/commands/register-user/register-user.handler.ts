import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { RegisterUserCommand } from './register-user.command';
import { UserAggregate, UserRole } from '../../write/aggregates/user.aggregate';
import { Email } from '../../write/value-objects/email.vo';
import { Password } from '../../write/value-objects/password.vo';
import { Inject } from '@nestjs/common';
import { WRITE_REPOSITORY_TOKEN, EVENT_BUS_TOKEN } from '../../../../common/di/tokens';

@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler implements ICommandHandler<RegisterUserCommand> {
  constructor(
    @Inject(WRITE_REPOSITORY_TOKEN)
    private readonly writeRepository: any,
    @Inject(EVENT_BUS_TOKEN)
    private readonly eventBus: any,
    private readonly publisher: EventPublisher,
  ) { }

  async execute(command: RegisterUserCommand): Promise<string> {
    // Validate input
    const email = Email.create(command.email);
    const password = Password.create(command.password);
    const role = (command.role as UserRole) || 'USER';

    // Check if user already exists (this would be a read operation in real CQRS)
    const existingUser = await this.writeRepository.findByEmail?.(email.getValue());
    if (existingUser) {
      throw new Error(`User with email ${command.email} already exists`);
    }

    // Create aggregate
    const user = await UserAggregate.create(command.userId, email, command.name, password, role);

    // Save to write repository (event sourcing)
    await this.writeRepository.save(user);

    // Publish events to event bus for projections
    const events = user.getUncommittedChanges();
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    // Mark events as committed
    user.markChangesAsCommitted();

    return command.userId;
  }
}

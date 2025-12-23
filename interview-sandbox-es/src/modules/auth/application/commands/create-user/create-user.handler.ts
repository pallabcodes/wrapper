import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { CreateUserCommand } from './create-user.command';
import { UserAggregate, UserRole } from '../../../domain/aggregates/user.aggregate';
import { Email } from '../../../domain/value-objects/email.vo';
import { Password } from '../../../domain/value-objects/password.vo';
import { Inject } from '@nestjs/common';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    private readonly publisher: EventPublisher,
    @Inject('EVENT_STORE')
    private readonly eventStore: any,
  ) { }

  async execute(command: CreateUserCommand): Promise<string> {
    // Validate input
    const email = Email.create(command.email);
    const password = Password.create(command.password);
    const role = (command.role as UserRole) || 'USER';

    // Create aggregate
    const user = await UserAggregate.create(command.userId, email, command.name, password, role);

    // Publish events to event store
    const events = user.getUncommittedChanges();
    await this.eventStore.append(command.userId, events);

    // Mark events as committed
    user.markChangesAsCommitted();

    // Publish to event bus for projections
    user.getUncommittedChanges().forEach(_event => {
      this.publisher.mergeObjectContext(user).commit();
    });

    return command.userId;
  }
}

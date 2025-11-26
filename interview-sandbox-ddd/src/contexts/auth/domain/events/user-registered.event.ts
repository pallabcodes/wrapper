import { DomainEvent } from '../../../../shared/domain/domain-event';

export class UserRegisteredEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly name: string,
    public readonly role: string,
  ) {
    super(userId, 1);
  }
}

import { DomainEvent } from '../../../../shared/domain/domain-event';

export class UserEmailVerifiedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {
    super(userId, 1);
  }
}

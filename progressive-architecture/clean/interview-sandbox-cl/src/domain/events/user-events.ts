import { DomainEvent } from './domain-event';

export class UserRegisteredEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly name: string,
    public readonly role: string
  ) {
    super(userId);
  }
}

export class UserEmailVerifiedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string
  ) {
    super(userId);
  }
}

export class UserPasswordChangedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string
  ) {
    super(userId);
  }
}

export class UserLoggedInEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly userAgent?: string,
    public readonly ipAddress?: string
  ) {
    super(userId);
  }
}

export class UserRoleChangedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly oldRole: string,
    public readonly newRole: string
  ) {
    super(userId);
  }
}

export class UserDeactivatedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly reason?: string
  ) {
    super(userId);
  }
}
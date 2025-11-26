export class UserEmailChangedEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly newEmail: string,
    public readonly oldEmail: string,
    public readonly timestamp: Date = new Date(),
  ) {}

  get eventType(): string {
    return 'UserEmailChangedEvent';
  }

  get eventVersion(): number {
    return 1;
  }
}

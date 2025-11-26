export class UserRegisteredEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly name: string,
    public readonly timestamp: Date = new Date(),
  ) {}

  get eventType(): string {
    return 'UserRegisteredEvent';
  }

  get eventVersion(): number {
    return 1;
  }

  get aggregateId(): string {
    return this.userId;
  }
}

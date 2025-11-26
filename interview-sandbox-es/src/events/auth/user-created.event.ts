export class UserCreatedEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly email: string,
    public readonly name: string,
    public readonly passwordHash: string,
    public readonly role: string,
    public readonly timestamp: Date = new Date(),
  ) {}

  get eventType(): string {
    return 'UserCreatedEvent';
  }

  get eventVersion(): number {
    return 1;
  }
}

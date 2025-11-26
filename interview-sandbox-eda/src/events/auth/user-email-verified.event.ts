export class UserEmailVerifiedEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly verifiedAt: Date,
    public readonly timestamp: Date = new Date(),
  ) {}

  get eventType(): string {
    return 'UserEmailVerifiedEvent';
  }

  get eventVersion(): number {
    return 1;
  }

  get aggregateId(): string {
    return this.userId;
  }
}

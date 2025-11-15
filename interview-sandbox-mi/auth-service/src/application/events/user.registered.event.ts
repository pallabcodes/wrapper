/**
 * Domain Event: User Registered
 * 
 * Events are part of Application layer
 * They represent something that happened in the domain
 */
export class UserRegisteredEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly name: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}


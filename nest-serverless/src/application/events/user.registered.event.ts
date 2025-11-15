/**
 * Domain Event: User Registered
 * 
 * Represents something that happened in the domain
 * Used for event-driven communication between services
 */
export class UserRegisteredEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly name: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}


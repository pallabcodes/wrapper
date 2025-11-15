/**
 * Domain Entity: User (User Service)
 * 
 * Each service has its own domain model
 * This is a simplified version for User Service
 */
export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string,
    public readonly isEmailVerified: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}


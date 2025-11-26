import { Injectable } from '@nestjs/common';
import { UserAggregate } from '../../domain/aggregates/user.aggregate';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';

@Injectable()
export class UserRepositoryImpl implements IUserRepository {
  private users = new Map<string, UserAggregate>();

  async save(user: UserAggregate): Promise<void> {
    // In-memory storage for demo - in production this would be a database
    this.users.set(user.id, user);
    console.log(`💾 Saved user aggregate: ${user.id}`);

    // In a real implementation, you would:
    // 1. Save the user entity to database
    // 2. Publish domain events to event store
    // 3. Handle optimistic concurrency
  }

  async findById(id: string): Promise<UserAggregate | null> {
    const user = this.users.get(id);
    return user || null;
  }

  async findByEmail(email: string): Promise<UserAggregate | null> {
    for (const user of this.users.values()) {
      if (user.email.getValue() === email) {
        return user;
      }
    }
    return null;
  }

  async findAll(): Promise<UserAggregate[]> {
    return Array.from(this.users.values());
  }

  async delete(id: string): Promise<void> {
    this.users.delete(id);
    console.log(`🗑️ Deleted user aggregate: ${id}`);
  }

  async exists(id: string): Promise<boolean> {
    return this.users.has(id);
  }
}

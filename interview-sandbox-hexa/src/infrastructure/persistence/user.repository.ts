import { Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/ports/output/user-repository.port';

@Injectable()
export class UserRepository implements IUserRepository {
  private users = new Map<string, User>();

  async save(user: User): Promise<User> {
    // In-memory storage for demo - in production this would be a database
    this.users.set(user.id, user);
    console.log(`💾 Saved user: ${user.id}`);

    // In a real implementation, you would:
    // 1. Save to database
    // 2. Handle optimistic concurrency
    // 3. Publish domain events

    return user;
  }

  async findById(id: string): Promise<User | null> {
    const user = this.users.get(id);
    return user || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email.getValue() === email) {
        return user;
      }
    }
    return null;
  }

  async findAll(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async delete(id: string): Promise<void> {
    this.users.delete(id);
    console.log(`🗑️ Deleted user: ${id}`);
  }

  async exists(id: string): Promise<boolean> {
    return this.users.has(id);
  }
}

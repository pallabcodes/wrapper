import { Injectable } from '@nestjs/common';
import { User } from '@domain/entities/user.entity';
import { UserRepositoryPort } from '@domain/ports/user.repository.port';

@Injectable()
export class UserRepositoryAdapter implements UserRepositoryPort {
  private users: Map<string, User> = new Map();

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findAll(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async update(id: string, updates: Partial<User>): Promise<User> {
    const existing = this.users.get(id);
    if (!existing) {
      throw new Error('User not found');
    }

    const updated = new User(
      existing.id,
      updates.email ?? existing.email,
      updates.name ?? existing.name,
      updates.isEmailVerified ?? existing.isEmailVerified,
      existing.createdAt,
      new Date(),
    );

    this.users.set(id, updated);
    return updated;
  }

  // Helper method to create user from event (called by event subscriber)
  async createFromEvent(userId: string, email: string, name: string): Promise<User> {
    const user = new User(
      userId,
      email,
      name,
      false, // isEmailVerified
      new Date(),
      new Date(),
    );
    this.users.set(userId, user);
    return user;
  }
}


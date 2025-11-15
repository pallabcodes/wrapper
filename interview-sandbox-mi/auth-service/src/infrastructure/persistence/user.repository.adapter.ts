/**
 * Adapter: User Repository Implementation
 * 
 * Implements the Port (interface) defined in Domain layer
 * Handles persistence (in-memory for demo, can be swapped for DB)
 * 
 * This is the "Adapter" in Hexagonal Architecture
 */
import { Injectable } from '@nestjs/common';
import { User } from '@domain/entities/user.entity';
import { UserRepositoryPort } from '@domain/ports/user.repository.port';

@Injectable()
export class UserRepositoryAdapter implements UserRepositoryPort {
  // In-memory storage (for demo - can be swapped for Sequelize, TypeORM, etc.)
  private users: Map<string, User> = new Map();

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async save(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
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
      updates.passwordHash ?? existing.passwordHash,
      updates.isEmailVerified ?? existing.isEmailVerified,
      existing.createdAt,
      new Date(),
    );

    this.users.set(id, updated);
    return updated;
  }
}


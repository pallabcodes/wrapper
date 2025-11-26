import { Injectable } from '@nestjs/common';
import { UserAggregate } from '../../domain/aggregates/user.aggregate';
import { UserRepository } from '../../domain/repositories/user.repository';

@Injectable()
export class UserRepositoryImpl implements UserRepository {
  private users = new Map<string, UserAggregate>();

  async save(user: UserAggregate): Promise<void> {
    // In-memory storage for demo - in production this would be a database
    this.users.set(user.getId(), user);
    console.log(`💾 Saved user: ${user.getId()}`);
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
    console.log(`🗑️ Deleted user: ${id}`);
  }
}

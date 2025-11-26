import { User } from '../../entities/user.entity';
import { Email } from '../../value-objects/email.vo';
import { UserId } from '../../value-objects/user-id.vo';
import { Specification } from '../../specifications/specification';

export const USER_REPOSITORY_PORT = Symbol('USER_REPOSITORY_PORT');

export interface UserRepositoryPort {
  // Basic CRUD operations
  findById(id: UserId | string): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  save(user: User): Promise<User>;
  update(user: User): Promise<User>;
  delete(id: UserId | string): Promise<void>;

  // Specification-based queries
  findOne(specification: Specification<User>): Promise<User | null>;
  findMany(specification: Specification<User>): Promise<User[]>;
  count(specification: Specification<User>): Promise<number>;
  exists(specification: Specification<User>): Promise<boolean>;

  // Advanced queries
  findActiveUsers(): Promise<User[]>;
  findUsersByRole(role: string): Promise<User[]>;
  findRecentlyCreated(days: number): Promise<User[]>;
  findUnverifiedUsers(): Promise<User[]>;
}


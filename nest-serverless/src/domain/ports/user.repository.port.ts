/**
 * Port: User Repository Interface
 * 
 * Defines the contract for user persistence
 * Domain layer defines this interface (Port)
 * Infrastructure layer implements it (Adapter)
 * 
 * This is the "Port" in Hexagonal Architecture
 */
import { User } from '../entities/user.entity';

export const USER_REPOSITORY_PORT = Symbol('USER_REPOSITORY_PORT');

export interface UserRepositoryPort {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  save(user: User): Promise<User>;
  update(id: string, updates: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
}


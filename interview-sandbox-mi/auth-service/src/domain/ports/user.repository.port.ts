/**
 * Port: User Repository
 * 
 * Interface defined in Domain layer
 * Implementation will be in Infrastructure layer (adapter)
 * 
 * This is the "Port" in Hexagonal Architecture
 */
import { User } from '../entities/user.entity';

export const USER_REPOSITORY_PORT = Symbol('USER_REPOSITORY_PORT');

export interface UserRepositoryPort {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  update(id: string, updates: Partial<User>): Promise<User>;
}


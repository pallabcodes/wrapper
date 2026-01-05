import { User, UserRole, UserStatus } from '../entities/user.entity';
import { Email } from '../value-objects/email.vo';
import { Username } from '../value-objects/username.vo';
import { PhoneNumber } from '../value-objects/phone-number.vo';

/**
 * Port: User Repository
 *
 * Interface for user data persistence operations
 * Defines what the domain needs from infrastructure
 */
export interface IUserRepository {
  /**
   * Save a new user
   */
  save(user: User): Promise<void>;

  /**
   * Find user by ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find user by email
   */
  findByEmail(email: Email): Promise<User | null>;

  /**
   * Find user by username
   */
  findByUsername(username: Username): Promise<User | null>;

  /**
   * Find user by Google OAuth ID
   */
  findByGoogleId(googleId: string): Promise<User | null>;

  /**
   * Find user by phone number
   */
  findByPhoneNumber(phoneNumber: PhoneNumber): Promise<User | null>;

  /**
   * Update existing user
   */
  update(user: User): Promise<void>;

  /**
   * Delete user (soft delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Check if email exists (for uniqueness validation)
   */
  emailExists(email: Email, excludeUserId?: string): Promise<boolean>;

  /**
   * Check if username exists (for uniqueness validation)
   */
  usernameExists(username: Username, excludeUserId?: string): Promise<boolean>;

  /**
   * Find users by status
   */
  findByStatus(status: UserStatus): Promise<User[]>;

  /**
   * Find users by role
   */
  findByRole(role: UserRole): Promise<User[]>;

  /**
   * Count total users
   */
  count(): Promise<number>;
}

export const USER_REPOSITORY = Symbol('IUserRepository');

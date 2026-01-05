import { User } from '../entities/user.entity';

/**
 * Port: Authentication Service
 *
 * Interface for authentication operations
 * Handles JWT tokens, password verification, etc.
 */
export interface IAuthService {
  /**
   * Generate JWT access token for user
   */
  generateAccessToken(user: User, tokenVersion?: number): Promise<string>;

  /**
   * Generate JWT refresh token for user
   */
  generateRefreshToken(user: User, tokenVersion?: number): Promise<string>;

  /**
   * Verify and decode JWT token
   */
  verifyToken(token: string): Promise<{ userId: string; email: string; jti: string; version: number } | null>;

  /**
   * Revoke a token by its JTI (JWT ID)
   */
  revokeToken(jti: string): Promise<void>;

  /**
   * Check if a token is revoked
   */
  isTokenRevoked(jti: string): Promise<boolean>;

  /**
   * Revoke all tokens for a user (useful for logout from all devices)
   */
  revokeAllUserTokens(userId: string): Promise<void>;

  /**
   * Increment user's token version (invalidates all existing tokens)
   */
  incrementTokenVersion(userId: string): Promise<number>;

  /**
   * Get current token version for user
   */
  getTokenVersion(userId: string): Promise<number>;

  /**
   * Hash a plain password
   */
  hashPassword(password: string): Promise<string>;

  /**
   * Verify password against hash
   */
  verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean>;

  /**
   * Generate secure random token (for email verification, password reset)
   */
  generateSecureToken(length?: number): string;
}

export const AUTH_SERVICE = Symbol('IAuthService');

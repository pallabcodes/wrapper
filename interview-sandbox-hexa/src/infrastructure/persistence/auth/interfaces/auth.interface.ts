/**
 * Authentication Module Interfaces
 * 
 * Centralized type definitions for authentication domain
 */

/**
 * User entity interface
 */
export interface IUser {
  readonly id: string;
  readonly email: string;
  readonly password?: string;
  readonly roles?: readonly string[];
  readonly claims?: readonly string[];
  readonly twoFactorEnabled?: boolean;
  readonly twoFactorSecret?: string;
  readonly googleId?: string;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

/**
 * Token payload interface
 */
export interface ITokenPayload {
  readonly sub: string;
  readonly email: string;
  readonly roles?: readonly string[];
  readonly claims?: readonly string[];
  readonly type?: 'access' | 'refresh';
  readonly iat?: number;
  readonly exp?: number;
}

/**
 * Token pair interface
 */
export interface ITokenPair {
  readonly accessToken: string;
  readonly refreshToken: string;
}

/**
 * Refresh token storage interface
 */
export interface IRefreshTokenStorage {
  readonly userId: string;
  readonly expiresAt: Date;
  readonly createdAt: Date;
}

import { Request } from 'express';

/**
 * Request with authenticated user
 * 
 * Extends Express Request to include authenticated user
 */
export interface IAuthenticatedRequest extends Request {
  user: IUser;
}


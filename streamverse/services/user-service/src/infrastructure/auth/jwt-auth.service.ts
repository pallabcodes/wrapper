import { Injectable, Inject, Optional } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../domain/entities/user.entity';
import { IAuthService, AUTH_SERVICE } from '../../domain/ports/auth-service.port';
import { RedisTokenService } from '../cache/redis-token.service';

/**
 * Infrastructure: JWT Authentication Service
 *
 * Implements IAuthService using JWT tokens, bcrypt, and Redis for advanced token management
 * Supports JTI-based revocation, token versioning, and refresh token rotation
 */
@Injectable()
export class JwtAuthService implements IAuthService {
  constructor(
    private readonly jwtService: JwtService,
    @Optional() private readonly redisTokenService?: RedisTokenService
  ) { }

  async generateAccessToken(user: User, tokenVersion?: number): Promise<string> {
    // Get current token version for the user (if Redis is available)
    const version = tokenVersion ?? (this.redisTokenService ? await this.redisTokenService.getTokenVersion(user.getId()) : 1);
    const now = Math.floor(Date.now() / 1000); // Current time in seconds

    const payload = {
      // Standard JWT claims
      sub: user.getId(),              // Subject (user ID)
      iss: 'streamverse-user-service', // Issuer
      aud: ['streamverse-api'],       // Audience (who can use this token)

      // JWT ID for uniqueness and revocation
      jti: uuidv4(),                  // Unique token identifier

      // Custom claims
      email: user.getEmail().getValue(),
      username: user.getUsername().getValue(),
      role: user.getRole(),
      type: 'access',
      version: version                // Token version for invalidation
    };

    const token = await this.jwtService.signAsync(payload, {
      expiresIn: '1h', // Access tokens expire in 1 hour
    });

    return token;
  }

  async generateRefreshToken(user: User, tokenVersion?: number): Promise<string> {
    // Get current token version for the user (if Redis is available)
    const version = tokenVersion ?? (this.redisTokenService ? await this.redisTokenService.getTokenVersion(user.getId()) : 1);
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const jti = uuidv4(); // Generate JTI for this refresh token

    const payload = {
      // Standard JWT claims
      sub: user.getId(),              // Subject (user ID)
      iss: 'streamverse-user-service', // Issuer
      aud: ['streamverse-api'],       // Audience (who can use this token)

      // JWT ID for uniqueness and revocation
      jti: jti,                       // Unique token identifier

      // Custom claims
      type: 'refresh',
      version: version                // Token version for invalidation
    };

    const token = await this.jwtService.signAsync(payload, {
      expiresIn: '7d', // Refresh tokens expire in 7 days
    });

    // Store refresh token in Redis for tracking (if Redis is available)
    if (this.redisTokenService) {
      await this.redisTokenService.storeRefreshToken(jti, user.getId(), 7 * 24 * 60 * 60);
    }

    return token;
  }

  async verifyToken(token: string): Promise<{ userId: string; email: string; jti: string; version: number } | null> {
    try {
      const payload = await this.jwtService.verifyAsync(token);

      // Additional validation for advanced claims
      if (!payload.jti || !payload.iss || !payload.aud) {
        return null; // Token missing required advanced claims
      }

      // Check issuer
      if (payload.iss !== 'streamverse-user-service') {
        return null; // Invalid issuer
      }

      // Check audience
      if (!Array.isArray(payload.aud) || !payload.aud.includes('streamverse-api')) {
        return null; // Invalid audience
      }

      // Check if token is revoked (if Redis is available)
      if (this.redisTokenService && await this.redisTokenService.isTokenRevoked(payload.jti)) {
        return null; // Token has been revoked
      }

      // Check token version (if Redis is available and this is an access token)
      if (this.redisTokenService && payload.type === 'access') {
        const currentVersion = await this.redisTokenService.getTokenVersion(payload.sub);
        if (payload.version !== currentVersion) {
          return null; // Token version is outdated (password changed, etc.)
        }
      }

      return {
        userId: payload.sub,
        email: payload.email,
        jti: payload.jti,
        version: payload.version || 1
      };
    } catch (error) {
      return null;
    }
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      return false;
    }
  }

  async revokeToken(jti: string): Promise<void> {
    if (!this.redisTokenService) {
      throw new Error('Redis service not available for token revocation');
    }
    // Revoke for 24 hours (longer than access token expiry)
    await this.redisTokenService.revokeToken(jti, 24 * 60 * 60);
  }

  async isTokenRevoked(jti: string): Promise<boolean> {
    if (!this.redisTokenService) {
      return false; // If no Redis, assume token is valid
    }
    return await this.redisTokenService.isTokenRevoked(jti);
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    if (!this.redisTokenService) {
      throw new Error('Redis service not available for token revocation');
    }
    // Increment token version to invalidate all existing tokens
    await this.redisTokenService.incrementTokenVersion(userId);
    // Also revoke all refresh tokens for this user
    await this.redisTokenService.revokeAllUserRefreshTokens(userId);
  }

  async incrementTokenVersion(userId: string): Promise<number> {
    if (!this.redisTokenService) {
      throw new Error('Redis service not available for token versioning');
    }
    return await this.redisTokenService.incrementTokenVersion(userId);
  }

  async getTokenVersion(userId: string): Promise<number> {
    if (!this.redisTokenService) {
      return 1; // Default version if no Redis
    }
    return await this.redisTokenService.getTokenVersion(userId);
  }

  generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AppLoggerService } from '../../../common/logger/logger.service';
import { IUser, ITokenPayload, ITokenPair, IRefreshTokenStorage } from './interfaces/auth.interface';

/**
 * Authentication Service
 * 
 * Handles:
 * - User registration and login
 * - JWT token generation (access & refresh)
 * - Token validation and refresh
 * - Token invalidation (blacklisting)
 * - Password hashing and verification
 * 
 * @class AuthService
 * @implements {IAuthService}
 */
@Injectable()
export class AuthService {
  private readonly tokenBlacklist = new Set<string>(); // In production, use Redis
  private readonly refreshTokens = new Map<string, IRefreshTokenStorage>(); // In production, use database
  private readonly logger: AppLoggerService;
  private readonly jwtConfig: {
    secret: string;
    accessTokenExpiration: string;
    refreshTokenExpiration: string;
  };
  private readonly passwordConfig: {
    minLength: number;
    saltRounds: number;
  };

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.logger = new AppLoggerService('AuthService');
    this.jwtConfig = this.configService.get('auth.jwt', {
      secret: 'your-secret-key-change-in-production',
      accessTokenExpiration: '15m',
      refreshTokenExpiration: '7d',
    });
    this.passwordConfig = this.configService.get('auth.password', {
      minLength: 8,
      saltRounds: 10,
    });
  }

  /**
   * Register a new user
   * 
   * @param email - User email address
   * @param password - User password (will be hashed)
   * @param roles - Optional user roles (defaults to ['user'])
   * @returns Promise<IUser> - Created user entity
   * @throws ConflictException - If user already exists
   * @throws BadRequestException - If validation fails
   */
  async register(email: string, password: string, roles: readonly string[] = ['user']): Promise<IUser> {
    this.logger.log(`Attempting to register user with email: ${email}`);

    // Validate password strength
    if (password.length < this.passwordConfig.minLength) {
      throw new BadRequestException(
        `Password must be at least ${this.passwordConfig.minLength} characters long`,
      );
    }

    // In production, check if user exists in database
    // const existingUser = await this.userRepository.findByEmail(email);
    // if (existingUser) {
    //   this.logger.warn(`Registration attempt with existing email: ${email}`);
    //   throw new ConflictException('User with this email already exists');
    // }

    try {
      const hashedPassword = await bcrypt.hash(password, this.passwordConfig.saltRounds);
      const claims = this.getClaimsForRoles(roles);

      const user: IUser = {
        id: `user_${Date.now()}`,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        roles: Object.freeze([...roles]),
        claims: Object.freeze(claims),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.logger.log(`User registered successfully: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error(`Failed to register user: ${email}`, error instanceof Error ? error.stack : String(error));
      throw new BadRequestException('Failed to register user');
    }
  }

  /**
   * Validate user credentials
   * 
   * @param email - User email address
   * @param password - User password (plaintext)
   * @returns Promise<IUser | null> - User entity if valid, null otherwise
   */
  async validateUser(email: string, password: string): Promise<IUser | null> {
    this.logger.debug(`Validating user credentials for: ${email}`);

    try {
      // In production, fetch from database
      // const user = await this.userRepository.findByEmail(email.toLowerCase().trim());
      // if (!user || !user.password) {
      //   this.logger.warn(`Login attempt with invalid email: ${email}`);
      //   return null;
      // }

      // Mock user for demonstration
      const mockPasswordHash = await bcrypt.hash('password', this.passwordConfig.saltRounds);
      const user: IUser = {
        id: '1',
        email: 'user@example.com',
        password: mockPasswordHash,
        roles: Object.freeze(['user']),
        claims: Object.freeze(['users:read']),
      };

      if (user.email.toLowerCase() !== email.toLowerCase().trim()) {
        this.logger.warn(`Login attempt with invalid email: ${email}`);
        return null;
      }

      if (!user.password) {
        this.logger.warn(`User account has no password: ${email}`);
        return null;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        this.logger.warn(`Invalid password attempt for: ${email}`);
        return null;
      }

      // Remove password from return value for security
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _password, ...result } = user;
      this.logger.log(`User validated successfully: ${user.id}`);
      return result as IUser;
    } catch (error) {
      this.logger.error(`Error validating user: ${email}`, error instanceof Error ? error.stack : String(error));
      return null;
    }
  }

  /**
   * Generate access and refresh tokens
   * 
   * @param user - User entity
   * @returns Promise<ITokenPair> - Token pair with access and refresh tokens
   */
  async generateTokens(user: IUser): Promise<ITokenPair> {
    this.logger.debug(`Generating tokens for user: ${user.id}`);

    try {
      const payload: {
        sub: string;
        email: string;
        roles?: string[];
        claims?: string[];
        type: string;
      } = {
        sub: user.id,
        email: user.email,
        roles: user.roles ? [...user.roles] : undefined,
        claims: user.claims ? [...user.claims] : undefined,
        type: 'access',
      };

      const accessToken = this.jwtService.sign(payload, {
        expiresIn: this.jwtConfig.accessTokenExpiration,
      } as any);

      const refreshPayload = {
        ...payload,
        type: 'refresh',
      };

      const refreshToken = this.jwtService.sign(refreshPayload, {
        expiresIn: this.jwtConfig.refreshTokenExpiration,
      } as any);

      // Store refresh token
      const expiresAt = new Date();
      const expirationDays = parseInt(this.jwtConfig.refreshTokenExpiration.replace('d', ''), 10) || 7;
      expiresAt.setDate(expiresAt.getDate() + expirationDays);

      const refreshTokenStorage: IRefreshTokenStorage = {
        userId: user.id,
        expiresAt,
        createdAt: new Date(),
      };

      this.refreshTokens.set(refreshToken, refreshTokenStorage);
      this.logger.log(`Tokens generated successfully for user: ${user.id}`);

      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      this.logger.error(`Failed to generate tokens for user: ${user.id}`, error instanceof Error ? error.stack : String(error));
      throw new BadRequestException('Failed to generate tokens');
    }
  }

  /**
   * Refresh access token using refresh token
   * 
   * @param refreshToken - Refresh token string
   * @returns Promise<{ accessToken: string }> - New access token
   * @throws UnauthorizedException - If refresh token is invalid, expired, or blacklisted
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    this.logger.debug('Attempting to refresh access token');

    // Check if refresh token is blacklisted
    if (this.tokenBlacklist.has(refreshToken)) {
      this.logger.warn('Refresh token attempt with blacklisted token');
      throw new UnauthorizedException('Refresh token has been invalidated');
    }

    // Check if refresh token exists in storage
    const storedToken = this.refreshTokens.get(refreshToken);
    if (!storedToken) {
      this.logger.warn('Refresh token attempt with non-existent token');
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if refresh token is expired
    if (storedToken.expiresAt < new Date()) {
      this.refreshTokens.delete(refreshToken);
      this.logger.warn(`Refresh token expired for user: ${storedToken.userId}`);
      throw new UnauthorizedException('Refresh token expired');
    }

    try {
      const payload = this.jwtService.verify<ITokenPayload>(refreshToken);

      if (payload.type !== 'refresh') {
        this.logger.warn('Refresh token attempt with invalid token type');
        throw new UnauthorizedException('Invalid token type');
      }

      // Generate new access token
      const newPayload: {
        sub: string;
        email: string;
        roles?: string[];
        claims?: string[];
        type: string;
      } = {
        sub: payload.sub,
        email: payload.email,
        roles: payload.roles ? [...payload.roles] : undefined,
        claims: payload.claims ? [...payload.claims] : undefined,
        type: 'access',
      };

      const accessToken = this.jwtService.sign(newPayload, {
        expiresIn: this.jwtConfig.accessTokenExpiration,
      } as any);

      this.logger.log(`Access token refreshed successfully for user: ${payload.sub}`);
      return { accessToken };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Failed to refresh access token', error instanceof Error ? error.stack : String(error));
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Invalidate tokens (logout)
   */
  async invalidateTokens(accessToken: string, refreshToken: string): Promise<void> {
    // Add tokens to blacklist
    this.tokenBlacklist.add(accessToken);
    this.tokenBlacklist.add(refreshToken);

    // Remove refresh token from storage
    this.refreshTokens.delete(refreshToken);
  }

  /**
   * Check if token is blacklisted
   */
  isTokenBlacklisted(token: string): boolean {
    return this.tokenBlacklist.has(token);
  }

  /**
   * Validate JWT token
   * 
   * @param token - JWT token string
   * @returns Promise<ITokenPayload | null> - Token payload if valid, null otherwise
   */
  async validateToken(token: string): Promise<ITokenPayload | null> {
    if (this.isTokenBlacklisted(token)) {
      this.logger.debug('Token validation failed: token is blacklisted');
      return null;
    }

    try {
      const payload = this.jwtService.verify<ITokenPayload>(token);
      return payload;
    } catch (error) {
      this.logger.debug('Token validation failed: invalid token', error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  /**
   * Get claims for roles
   * 
   * Maps roles to their associated claims/permissions
   * 
   * @param roles - Array of role names
   * @returns Array of claim strings
   * @private
   */
  private getClaimsForRoles(roles: readonly string[]): readonly string[] {
    const roleClaimsMap: Record<string, string[]> = {
      admin: ['*'], // All claims
      moderator: ['users:read', 'users:write', 'posts:read', 'posts:write'],
      user: ['users:read', 'posts:read'],
    };

    const claims = new Set<string>();
    roles.forEach((role) => {
      const roleClaims = roleClaimsMap[role] || [];
      roleClaims.forEach((claim) => {
        if (claim === '*') {
          // Admin has all claims
          Object.values(roleClaimsMap).flat().filter((c) => c !== '*').forEach((c) => claims.add(c));
        } else {
          claims.add(claim);
        }
      });
    });

    return Object.freeze(Array.from(claims));
  }
}


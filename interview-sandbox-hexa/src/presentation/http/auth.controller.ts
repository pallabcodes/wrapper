import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from '../../application/services/auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RegisterDto } from '../../infrastructure/persistence/auth/dto/register.dto';
import { LoginDto } from '../../infrastructure/persistence/auth/dto/login.dto';
import { RefreshTokenDto } from '../../infrastructure/persistence/auth/dto/refresh-token.dto';
import { TwoFactorVerifyDto } from '../../infrastructure/persistence/auth/dto/two-factor.dto';
import { IAuthenticatedRequest } from '../../infrastructure/persistence/auth/interfaces/auth.interface';
import { AppLoggerService } from '../../common/logger/logger.service';
import { AuthResponseMapper } from '../mappers/auth-response.mapper';

/**
 * Authentication Controller - Hexagonal Architecture
 *
 * Presentation layer that:
 * - Receives HTTP requests
 * - Calls application services (use cases)
 * - Returns HTTP responses
 *
 * Does NOT directly call infrastructure services - follows dependency inversion
 *
 * @class AuthController
 */
import { TwoFactorService } from '../../infrastructure/persistence/auth/two-factor.service';
import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.vo';

@Controller('auth')
export class AuthController {
  private readonly logger: AppLoggerService;

  constructor(
    private readonly authService: AuthService, // Application service
    private readonly responseMapper: AuthResponseMapper,
    private readonly twoFactorService: TwoFactorService,
  ) {
    this.logger = new AppLoggerService('AuthController');
  }

  /**
   * Register new user - Hexagonal Architecture
   *
   * Presentation layer calls application service (use case)
   * Application service orchestrates domain logic through ports
   *
   * @param registerDto - Registration data from HTTP request
   * @returns Promise<AuthResponseDto> - HTTP response with user data and tokens
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto, @Request() req: any): Promise<any> {
    this.logger.log(`Registration attempt for email: ${registerDto.email}`);

    try {
      // Call application service (use case) - follows hexagonal architecture
      const result = await this.authService.register({
        email: registerDto.email,
        name: registerDto.name || 'User', // Fallback if name not provided
        password: registerDto.password,
        role: registerDto.roles?.[0], // Take first role or undefined
      });

      this.logger.log(`User registered successfully: ${result.user.id}`);
      const requestId = req.headers['x-request-id'] as string | undefined;
      const userDto = {
        id: result.user.id,
        email: result.user.email.getValue(),
        roles: [result.user.role],
      };
      return this.responseMapper.toRegisterResponse(userDto, result, requestId);
    } catch (error) {
      this.logger.error(`Registration failed for: ${registerDto.email}`, error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  /**
   * Login with email and password - Hexagonal Architecture
   *
   * Presentation layer calls application service (use case)
   * Application service validates credentials through domain logic
   *
   * @param loginDto - Login credentials from HTTP request
   * @returns Promise<AuthResponseDto> - HTTP response with user data and tokens
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Request() req: any): Promise<any> {
    this.logger.log(`Login attempt for email: ${loginDto.email}`);

    try {
      // Call application service (use case) - follows hexagonal architecture
      const result = await this.authService.login({
        email: loginDto.email,
        password: loginDto.password,
      });

      this.logger.log(`Login successful for user: ${result.user.id}`);
      const requestId = req.headers['x-request-id'] as string | undefined;
      const userDto = {
        id: result.user.id,
        email: result.user.email.getValue(),
        roles: [result.user.role],
      };
      return this.responseMapper.toLoginResponse(userDto, result, requestId);
    } catch {
      this.logger.warn(`Failed login attempt for: ${loginDto.email}`);
      throw new UnauthorizedException('Invalid email or password');
    }
  }

  /**
   * Refresh access token
   * 
   * @param refreshTokenDto - Refresh token data
   * @returns Promise<{ accessToken: string }> - New access token
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto, @Request() req: any): Promise<any> {
    this.logger.debug('Token refresh attempt');
    const result = await this.authService.refreshAccessToken(refreshTokenDto.refreshToken);
    const requestId = req.headers['x-request-id'] as string | undefined;
    return this.responseMapper.toRefreshTokenResponse(result.accessToken, requestId);
  }

  /**
   * Logout (invalidate tokens)
   * 
   * @param req - Authenticated request
   * @param refreshTokenDto - Refresh token to invalidate
   * @returns Promise<{ message: string }> - Success message
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Request() req: IAuthenticatedRequest,
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<any> {
    this.logger.log(`Logout request for user: ${req.user.id}`);

    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.replace('Bearer ', '');

    if (accessToken && refreshTokenDto.refreshToken) {
      await this.authService.invalidateTokens(accessToken, refreshTokenDto.refreshToken);
      this.logger.log(`Tokens invalidated for user: ${req.user.id}`);
    }
    const requestId = req.headers['x-request-id'] as string | undefined;
    return this.responseMapper.toLogoutResponse(requestId);
  }

  /**
   * Get current user profile - Hexagonal Architecture
   *
   * Presentation layer calls application service (use case)
   * Application service retrieves user through domain repository port
   *
   * @param req - Authenticated request
   * @returns Promise<any> - HTTP response with user profile
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: IAuthenticatedRequest): Promise<any> {
    this.logger.debug(`Profile request for user: ${req.user.id}`);

    try {
      // Call application service (use case) - follows hexagonal architecture
      const user = await this.authService.getUserById(req.user.id);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const requestId = req.headers['x-request-id'] as string | undefined;
      const userProfile = {
        id: user.id,
        email: user.email.getValue(),
        roles: [user.role],
        isEmailVerified: user.isEmailVerified,
      };

      return this.responseMapper.toProfileResponse(userProfile, requestId);
    } catch (error) {
      this.logger.error(`Profile request failed for user: ${req.user.id}`, error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  /**
   * Setup 2FA
   */
  @UseGuards(JwtAuthGuard)
  @Post('2fa/setup')
  async setupTwoFactor(@Request() req: any): Promise<any> {
    const userId = req.user.id;
    const { secret, qrCodeUrl } = await this.twoFactorService.generateSecret(userId);
    await this.twoFactorService.enableTwoFactor(userId, secret);
    const requestId = req.headers['x-request-id'] as string | undefined;
    return this.responseMapper.toTwoFactorSetupResponse(secret, qrCodeUrl, requestId);
  }

  /**
   * Verify 2FA code
   * 
   * @param req - Authenticated request
   * @param verifyDto - 2FA verification code
   * @returns Promise<{ message: string }> - Success message
   */
  @UseGuards(JwtAuthGuard)
  @Post('2fa/verify')
  async verifyTwoFactor(
    @Request() req: IAuthenticatedRequest,
    @Body() verifyDto: TwoFactorVerifyDto,
  ): Promise<any> {
    this.logger.log(`2FA verification attempt for user: ${req.user.id}`);

    // In production, get secret from database
    const userId = req.user.id;
    const secret = `2FA_SECRET_${userId}`;
    const isValid = await this.twoFactorService.verifyCode(secret, verifyDto.code);

    if (!isValid) {
      this.logger.warn(`Invalid 2FA code attempt for user: ${userId}`);
      throw new BadRequestException('Invalid 2FA code');
    }

    this.logger.log(`2FA verified successfully for user: ${userId}`);
    const requestId = req.headers['x-request-id'] as string | undefined;
    return this.responseMapper.toTwoFactorVerifyResponse(requestId);
  }

  /**
   * Google OAuth login
   */
  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Initiates Google OAuth flow
  }

  /**
   * Google OAuth callback
   * 
   * @param req - Request with Google user data
   * @param res - Express response
   */
  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Request() req: IAuthenticatedRequest, @Res() res: Response): Promise<void> {
    const googleUser = req.user as any;
    this.logger.log(`Google OAuth callback for: ${googleUser.email}`);

    try {
      // In production, create or find user by googleId
      // Create a temporary User entity for token generation (simplified)
      // Note: In a real app, you would use a use case to find/create the user properly
      const email = Email.create(googleUser.email);
      const user = new User(
        googleUser.googleId,
        email,
        googleUser.name || 'Google User',
        'oauth_placeholder_hash',
        'USER'
      );

      const tokens = await this.authService.generateTokens(user);
      this.logger.log(`Google OAuth successful for user: ${user.id}`);
      const requestId = req.headers['x-request-id'] as string | undefined;

      const userDto = {
        id: user.id,
        email: user.email.getValue(),
        roles: [user.role],
      };

      const response = this.responseMapper.toGoogleOAuthResponse(userDto, tokens, requestId);
      res.json(response);
    } catch (error) {
      this.logger.error('Google OAuth callback failed', error instanceof Error ? error.stack : String(error));
      res.status(500).json({ message: 'OAuth authentication failed' });
    }
  }
}


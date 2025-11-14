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
import { AuthService } from '../../infrastructure/persistence/auth/auth.service';
import { TwoFactorService } from '../../infrastructure/persistence/auth/two-factor.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RegisterDto } from '../../infrastructure/persistence/auth/dto/register.dto';
import { LoginDto } from '../../infrastructure/persistence/auth/dto/login.dto';
import { RefreshTokenDto } from '../../infrastructure/persistence/auth/dto/refresh-token.dto';
import { AuthResponseDto } from '../../infrastructure/persistence/auth/dto/auth-response.dto';
import { TwoFactorVerifyDto } from '../../infrastructure/persistence/auth/dto/two-factor.dto';
import { IAuthenticatedRequest } from '../../infrastructure/persistence/auth/interfaces/auth.interface';
import { AppLoggerService } from '../../common/logger/logger.service';
import { AuthResponseMapper } from '../mappers/auth-response.mapper';

/**
 * Authentication Controller
 * 
 * Handles:
 * - User registration
 * - User login (local, Google OAuth)
 * - Token refresh
 * - Token invalidation (logout)
 * - 2FA setup and verification
 * - User profile retrieval
 * 
 * @class AuthController
 */
@Controller('auth')
export class AuthController {
  private readonly logger: AppLoggerService;

  constructor(
    private readonly authService: AuthService,
    private readonly twoFactorService: TwoFactorService,
    private readonly responseMapper: AuthResponseMapper,
  ) {
    this.logger = new AppLoggerService('AuthController');
  }

  /**
   * Register new user
   * 
   * @param registerDto - Registration data
   * @returns Promise<AuthResponseDto> - User data and tokens
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto, @Request() req: any): Promise<any> {
    this.logger.log(`Registration attempt for email: ${registerDto.email}`);

    try {
      const user = await this.authService.register(
        registerDto.email,
        registerDto.password,
        registerDto.roles,
      );
      const tokens = await this.authService.generateTokens(user);

      this.logger.log(`User registered successfully: ${user.id}`);
      const requestId = req.headers['x-request-id'] as string | undefined;
      return this.responseMapper.toRegisterResponse(user, tokens, requestId);
    } catch (error) {
      this.logger.error(`Registration failed for: ${registerDto.email}`, error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  /**
   * Login with email and password
   * 
   * @param loginDto - Login credentials
   * @returns Promise<AuthResponseDto> - User data and tokens
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Request() req: any): Promise<any> {
    this.logger.log(`Login attempt for email: ${loginDto.email}`);

    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      this.logger.warn(`Failed login attempt for: ${loginDto.email}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    try {
      const tokens = await this.authService.generateTokens(user);
      this.logger.log(`Login successful for user: ${user.id}`);
      const requestId = req.headers['x-request-id'] as string | undefined;
      return this.responseMapper.toLoginResponse(user, tokens, requestId);
    } catch (error) {
      this.logger.error(`Login failed for: ${loginDto.email}`, error instanceof Error ? error.stack : String(error));
      throw new BadRequestException('Failed to generate tokens');
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
   * Get current user profile
   * 
   * @param req - Authenticated request
   * @returns IUser - Current user profile
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: IAuthenticatedRequest): any {
    this.logger.debug(`Profile request for user: ${req.user.id}`);
    const requestId = req.headers['x-request-id'] as string | undefined;
    const user = {
      id: req.user.id,
      email: req.user.email,
      roles: req.user.roles,
    };
    return this.responseMapper.toProfileResponse(user, requestId);
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
      const user = {
        id: googleUser.googleId,
        email: googleUser.email,
        roles: ['user'] as string[],
      };

      const tokens = await this.authService.generateTokens(user);
      this.logger.log(`Google OAuth successful for user: ${user.id}`);
      const requestId = req.headers['x-request-id'] as string | undefined;
      const response = this.responseMapper.toGoogleOAuthResponse(user, tokens, requestId);
      res.json(response);
    } catch (error) {
      this.logger.error('Google OAuth callback failed', error instanceof Error ? error.stack : String(error));
      res.status(500).json({ message: 'OAuth authentication failed' });
    }
  }
}


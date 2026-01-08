import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus, UseGuards, Res, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';

// ================================
// 🏗️ APPLICATION LAYER IMPORTS
// ================================
// 🎯 INDIVIDUAL USE CASES - One per business operation (Clean Architecture)
import { RegisterUserUseCase } from '../../../application/use-cases/register-user.usecase';
import { LoginUserUseCase } from '../../../application/use-cases/login-user.usecase';
import { RefreshTokenUseCase } from '../../../application/use-cases/refresh-token.usecase';
import { VerifyEmailUseCase } from '../../../application/use-cases/verify-email.usecase';
import { GoogleLoginUseCase, GoogleLoginException } from '../../../application/use-cases/google-login.usecase';
import { RequestMagicLinkUseCase } from '../../../application/use-cases/request-magic-link.usecase';
import { VerifyMagicLinkUseCase } from '../../../application/use-cases/verify-magic-link.usecase';
import { RequestOtpUseCase } from '../../../application/use-cases/request-otp.usecase';
import { VerifyOtpUseCase } from '../../../application/use-cases/verify-otp.usecase';

// Application DTOs - Internal Data Contracts
import { RegisterUserRequest } from '../../../application/dto/register-user-request.dto';
import { LoginRequest } from '../../../application/dto/login-request.dto';
import { RefreshTokenRequest } from '../../../application/dto/refresh-token-request.dto';
import { VerifyEmailRequest } from '../../../application/dto/verify-email-request.dto';

// ================================
// 🌐 PRESENTATION LAYER IMPORTS
// ================================
// HTTP Request DTOs - External API Contracts
import { RegisterUserHttpDto } from '../dto/register-user-http.dto';
import { LoginUserHttpDto } from '../dto/login-user-http.dto';
import { VerifyEmailHttpDto } from '../dto/verify-email-http.dto';

// HTTP Response DTOs - API Response Contracts
import { UserHttpResponse } from '../dto/user-http-response.dto';

// ================================
// 🛡️ INFRASTRUCTURE IMPORTS
// ================================
import { RateLimitGuard } from '../../../infrastructure/security/rate-limit.guard';
import { GoogleOAuthUser } from '../../../infrastructure/auth/google-oauth.strategy';
import { JwtAuthGuard } from '../../../infrastructure/security/jwt-auth.guard';

// Cookie configuration constants
const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token';
const REFRESH_TOKEN_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Presentation Layer: HTTP User Controller
 *
 * REST API endpoints for user operations
 * Translates HTTP requests to application use cases
 *
 * SECURITY: Refresh tokens are stored in HttpOnly cookies
 * - Prevents XSS attacks from stealing long-lived tokens
 * - Browser automatically sends cookie on refresh requests
 * - Access tokens are returned in body (short-lived, acceptable)
 */
@Controller('users')
export class UserController {
  // 🎯 CLEAN ARCHITECTURE: Individual use case injection (not a single service)
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,  // 👤 User registration workflow
    private readonly loginUserUseCase: LoginUserUseCase,        // 🔐 Authentication workflow
    private readonly refreshTokenUseCase: RefreshTokenUseCase,  // 🔄 Token refresh workflow
    private readonly verifyEmailUseCase: VerifyEmailUseCase,    // 📧 Email verification workflow
    private readonly googleLoginUseCase: GoogleLoginUseCase,    // 🌐 Google OAuth workflow
    private readonly requestMagicLinkUseCase: RequestMagicLinkUseCase, // 🔗 Magic link request
    private readonly verifyMagicLinkUseCase: VerifyMagicLinkUseCase,   // 🔗 Magic link verification
    private readonly requestOtpUseCase: RequestOtpUseCase,             // 🔢 OTP request
    private readonly verifyOtpUseCase: VerifyOtpUseCase,               // 🔢 OTP verification
    private readonly configService: ConfigService,              // ⚙️ Environment configuration
  ) { }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RateLimitGuard)
  async register(@Body() dto: RegisterUserHttpDto): Promise<UserHttpResponse> {
    // 🏭 FACTORY: Create Application DTO from HTTP DTO
    const request = RegisterUserRequest.fromHttpDto({
      email: dto.email,
      username: dto.username,
      password: dto.password,
      role: dto.role,
    });

    // Execute use case
    const userResponse = await this.registerUserUseCase.execute(request);

    // Transform Application DTO to HTTP response
    return UserHttpResponse.fromAppDto(userResponse);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  async login(
    @Body() dto: LoginUserHttpDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    // 🏭 FACTORY: Create Application DTO from HTTP DTO
    const request = LoginRequest.fromHttpDto({
      emailOrUsername: dto.emailOrUsername,
      password: dto.password,
    });

    // Execute use case
    const loginResponse = await this.loginUserUseCase.execute(request);

    // 🔒 SECURITY: Set refresh token as HttpOnly cookie
    this.setRefreshTokenCookie(response, loginResponse.refreshToken);

    // Return response WITHOUT refreshToken in body (it's in the cookie)
    return {
      user: UserHttpResponse.fromAppDto(loginResponse.user),
      accessToken: loginResponse.accessToken,
      expiresIn: loginResponse.expiresIn,
      tokenType: 'Bearer',
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  async refreshToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    // 🔒 SECURITY: Read refresh token from HttpOnly cookie (not body)
    const refreshToken = request.cookies?.[REFRESH_TOKEN_COOKIE_NAME];

    if (!refreshToken) {
      response.status(HttpStatus.UNAUTHORIZED);
      return { message: 'Refresh token not found', error: 'MISSING_REFRESH_TOKEN' };
    }

    // 🏭 FACTORY: Create Application DTO
    const appRequest = RefreshTokenRequest.fromHttpDto({ refreshToken });

    // Execute use case
    const refreshResponse = await this.refreshTokenUseCase.execute(appRequest);

    // 🔒 SECURITY: Set new refresh token as HttpOnly cookie (token rotation)
    this.setRefreshTokenCookie(response, refreshResponse.refreshToken);

    // Return response WITHOUT refreshToken in body
    return {
      accessToken: refreshResponse.accessToken,
      expiresIn: refreshResponse.expiresIn,
      tokenType: 'Bearer',
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) response: Response) {
    // 🔒 SECURITY: Clear the refresh token cookie
    this.clearRefreshTokenCookie(response);

    return { message: 'Logged out successfully' };
  }

  // ================================
  // 🌐 GOOGLE OAUTH ENDPOINTS
  // ================================

  /**
   * Initiates Google OAuth flow
   * Redirects user to Google consent screen
   */
  @Get('auth/google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Guard handles redirect to Google
  }

  /**
   * Google OAuth callback
   * Handles successful authentication from Google
   */
  @Get('auth/google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(
    @Req() req: Request & { user: GoogleOAuthUser },
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const result = await this.googleLoginUseCase.execute(req.user);

      // Set refresh token as HttpOnly cookie
      this.setRefreshTokenCookie(response, result.refreshToken);

      // Redirect to frontend with access token
      // In production, redirect to frontend URL with token in fragment
      const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
      return response.redirect(
        `${frontendUrl}/auth/callback?token=${result.accessToken}&isNew=${result.isNewUser}`,
      );
    } catch (error) {
      if (error instanceof GoogleLoginException) {
        const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
        return response.redirect(
          `${frontendUrl}/auth/error?code=${error.code}&message=${encodeURIComponent(error.message)}`,
        );
      }
      throw error;
    }
  }

  // ================================
  // 🔗 MAGIC LINK ENDPOINTS
  // ================================

  /**
   * Request a magic link login email
   */
  @Post('auth/magic-link')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  async requestMagicLink(@Body('email') email: string) {
    if (!email) {
      return { message: 'Email is required' };
    }
    return this.requestMagicLinkUseCase.execute({ email });
  }

  /**
   * Verify magic link token and login
   * Redirects to frontend with tokens
   */
  @Get('auth/magic-link/verify')
  async verifyMagicLink(
    @Query('token') token: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const result = await this.verifyMagicLinkUseCase.execute({ token });

      // Set refresh token as HttpOnly cookie
      this.setRefreshTokenCookie(response, result.refreshToken);

      // Redirect to frontend with access token
      const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
      return response.redirect(
        `${frontendUrl}/auth/callback?token=${result.accessToken}&isNew=${result.isNewUser}`,
      );
    } catch (error) {
      const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
      const message = error instanceof Error ? error.message : 'Invalid link';
      return response.redirect(
        `${frontendUrl}/auth/error?code=MAGIC_LINK_FAILED&message=${encodeURIComponent(message)}`,
      );
    }
  }

  // ================================
  // 🔢 OTP ENDPOINTS
  // ================================

  /**
   * Request OTP (Email or SMS)
   */
  @Post('auth/otp/request')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  async requestOtp(@Body() body: { identifier: string; type: 'email' | 'sms' }) {
    if (!body.identifier || !body.type) {
      return { message: 'Identifier and type are required' };
    }
    return this.requestOtpUseCase.execute(body);
  }

  /**
   * Verify OTP and Login
   */
  @Post('auth/otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body() body: { identifier: string; code: string },
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!body.identifier || !body.code) {
      return { message: 'Identifier and code are required' };
    }

    const result = await this.verifyOtpUseCase.execute(body);

    // Set refresh token as HttpOnly cookie
    this.setRefreshTokenCookie(response, result.refreshToken);

    // Return tokens (same format as login)
    return {
      user: UserHttpResponse.fromAppDto(result.user),
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
      isNewUser: result.isNewUser,
      tokenType: 'Bearer',
    };
  }

  /**
   * Protected Routes
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req) {
    return {
      message: 'Profile retrieved successfully',
      user: req.user
    };
  }


  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  async verifyEmail(@Body() dto: VerifyEmailHttpDto) {
    // 🏭 FACTORY: Create Application DTO from HTTP DTO
    const request = VerifyEmailRequest.fromHttpDto({
      token: dto.token,
    });

    // Execute use case
    const verifyResponse = await this.verifyEmailUseCase.execute(request);

    // Return verification result
    return {
      message: 'Email verified successfully',
      email: verifyResponse.email,
      verifiedAt: verifyResponse.verifiedAt,
    };
  }

  // ================================
  // 🔒 PRIVATE: Cookie Helpers
  // ================================

  /**
   * Set refresh token as secure HttpOnly cookie
   * - HttpOnly: Not accessible via JavaScript (XSS protection)
   * - Secure: Only sent over HTTPS (in production)
   * - SameSite=Strict: CSRF protection
   * - Path=/users/refresh: Only sent to refresh endpoint
   */
  private setRefreshTokenCookie(response: Response, refreshToken: string): void {
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    response.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: isProduction, // HTTPS only in production
      sameSite: 'strict',   // CSRF protection
      path: '/users',       // Scoped to /users endpoints
      maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
    });
  }

  /**
   * Clear the refresh token cookie on logout
   */
  private clearRefreshTokenCookie(response: Response): void {
    response.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'strict',
      path: '/users',
    });
  }
}
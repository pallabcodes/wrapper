import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Public } from '@common/decorators/public.decorator';
import { AuthResponseMapper } from './mappers/auth-response.mapper';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly responseMapper: AuthResponseMapper,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return this.responseMapper.toCreateResponse(result);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return this.responseMapper.toLoginResponse(result);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK) // Success response: 200 OK
  // Swagger documentation only (does NOT control actual HTTP status codes):
  @ApiOperation({ summary: 'Verify email with OTP' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' }) // Documented for Swagger, but actual 400 comes from service throwing BadRequestException
  async verifyEmail(@Body() verifyOtpDto: VerifyOtpDto) {
    // Controller only handles SUCCESS path
    // All error handling (400, 404, etc.) happens in authService.verifyEmail()
    // If service throws BadRequestException/NotFoundException, NestJS automatically sends 400/404
    const result = await this.authService.verifyEmail(verifyOtpDto);
    return this.responseMapper.toSuccessMessageResponse('Email verified successfully', result);
  }

  @Public()
  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend OTP code' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  async resendOtp(@Body() resendOtpDto: ResendOtpDto) {
    await this.authService.resendOtp(resendOtpDto);
    return this.responseMapper.toSuccessMessageResponse('OTP sent successfully');
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset OTP' })
  @ApiResponse({ status: 200, description: 'Password reset OTP sent if email exists' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto);
    return this.responseMapper.toSuccessMessageResponse('Password reset OTP sent if email exists');
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with OTP' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);
    return this.responseMapper.toSuccessMessageResponse('Password reset successfully');
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    const tokens = await this.authService.refreshToken(refreshTokenDto);
    return this.responseMapper.toRefreshTokenResponse(tokens);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@CurrentUser() user: { id: number }) {
    const result = await this.authService.getCurrentUser(user.id);
    return this.responseMapper.toReadResponse(result);
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to Google OAuth' })
  async googleAuth() {
    // This will be handled by Passport
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({ status: 200, description: 'Google login successful' })
  async googleAuthCallback(@CurrentUser() user: { id: number; email: string; name: string }) {
    // Generate tokens for the authenticated user
    const tokens = await this.authService.generateTokensForUser(user.id, user.email);
    return this.responseMapper.toOAuthResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      tokens,
    });
  }

  @Public()
  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  @ApiOperation({ summary: 'Initiate Facebook OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to Facebook OAuth' })
  async facebookAuth() {
    // This will be handled by Passport
  }

  @Public()
  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  @ApiOperation({ summary: 'Facebook OAuth callback' })
  @ApiResponse({ status: 200, description: 'Facebook login successful' })
  async facebookAuthCallback(@CurrentUser() user: { id: number; email: string; name: string }) {
    // Generate tokens for the authenticated user
    const tokens = await this.authService.generateTokensForUser(user.id, user.email);
    return this.responseMapper.toOAuthResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      tokens,
    });
  }
}


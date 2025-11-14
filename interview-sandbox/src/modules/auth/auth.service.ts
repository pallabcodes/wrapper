import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthRepository } from './auth.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { OtpType } from '../../database/models/otp.model';

@Injectable()
export class AuthService {
  constructor(
    private authRepository: AuthRepository,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.authRepository.findUserByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      registerDto.password,
      this.configService.get<number>('bcrypt.rounds') || 12,
    );

    // Create user
    const user = await this.authRepository.createUser({
      email: registerDto.email,
      password: hashedPassword,
      name: registerDto.name,
      phone: registerDto.phone,
    });

    // Generate OTP for email verification
    const otp = await this.generateOtp(user.id, OtpType.VERIFY);

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isEmailVerified: user.isEmailVerified,
      },
      tokens,
      otp: {
        code: otp.code,
        expiresAt: otp.expiresAt,
      },
    };
  }

  async login(loginDto: LoginDto) {
    // Find user
    const user = await this.authRepository.findUserByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isEmailVerified: user.isEmailVerified,
      },
      tokens,
    };
  }

  async verifyEmail(verifyOtpDto: VerifyOtpDto) {
    const user = await this.authRepository.findUserByEmail(verifyOtpDto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Verify OTP
    const otp = await this.authRepository.findValidOtp(
      user.id,
      verifyOtpDto.code,
      OtpType.VERIFY,
    );

    if (!otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Update user
    await this.authRepository.updateUser(user.id, { isEmailVerified: true });

    // Invalidate used OTP
    await this.authRepository.invalidateUserOtps(user.id, OtpType.VERIFY);

    return {
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isEmailVerified: true,
      },
    };
  }

  async resendOtp(resendOtpDto: ResendOtpDto) {
    const user = await this.authRepository.findUserByEmail(resendOtpDto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Invalidate existing OTPs of this type
    await this.authRepository.invalidateUserOtps(user.id, resendOtpDto.type);

    // Generate new OTP
    const otp = await this.generateOtp(user.id, resendOtpDto.type);

    return {
      message: 'OTP sent successfully',
      otp: {
        code: otp.code,
        expiresAt: otp.expiresAt,
      },
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.authRepository.findUserByEmail(forgotPasswordDto.email);
    if (!user) {
      // Don't reveal if user exists for security
      return {
        message: 'If the email exists, a password reset OTP has been sent',
      };
    }

    // Invalidate existing reset OTPs
    await this.authRepository.invalidateUserOtps(user.id, OtpType.RESET);

    // Generate reset OTP
    const otp = await this.generateOtp(user.id, OtpType.RESET);

    return {
      message: 'If the email exists, a password reset OTP has been sent',
      otp: {
        code: otp.code,
        expiresAt: otp.expiresAt,
      },
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.authRepository.findUserByEmail(resetPasswordDto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify OTP
    const otp = await this.authRepository.findValidOtp(
      user.id,
      resetPasswordDto.code,
      OtpType.RESET,
    );

    if (!otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(
      resetPasswordDto.newPassword,
      this.configService.get<number>('bcrypt.rounds') || 12,
    );

    // Update user password
    await this.authRepository.updateUser(user.id, { password: hashedPassword });

    // Invalidate used OTP
    await this.authRepository.invalidateUserOtps(user.id, OtpType.RESET);

    return {
      message: 'Password reset successfully',
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      const user = await this.authRepository.findUserById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user.id, user.email);

      return {
        tokens,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getCurrentUser(userId: number) {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
    };
  }

  // Helper methods
  private async generateOtp(userId: number, type: OtpType) {
    const code = this.generateOtpCode();
    const expiration = this.configService.get<number>('otp.expiration') || 600000;
    const expiresAt = new Date(Date.now() + expiration);

    // Invalidate existing OTPs of this type
    await this.authRepository.invalidateUserOtps(userId, type);

    return this.authRepository.createOtp({
      userId,
      code,
      type,
      expiresAt,
    });
  }

  private generateOtpCode(): string {
    const length = this.configService.get<number>('otp.length') || 6;
    const digits = '0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    return code;
  }

  private async generateTokens(userId: number, email: string) {
    const payload = { sub: userId, email };
    const accessTokenExpiration = this.configService.get<string>('jwt.accessTokenExpiration') || '15m';
    const refreshTokenExpiration = this.configService.get<string>('jwt.refreshTokenExpiration') || '7d';

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: accessTokenExpiration,
    } as any);

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: refreshTokenExpiration,
    } as any);

    return {
      accessToken,
      refreshToken,
    };
  }

  async generateTokensForUser(userId: number, email: string) {
    return this.generateTokens(userId, email);
  }
}


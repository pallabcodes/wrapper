/**
 * Presentation Controller: Auth Controller
 * 
 * Handles HTTP requests
 * Depends on Application layer (services)
 * 
 * This is the "Adapter" in Hexagonal Architecture
 */
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from '@application/services/auth.service';
import { RegisterRequestDto } from '../dto/register.request.dto';
import { LoginRequestDto } from '../dto/login.request.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterRequestDto) {
    const result = await this.authService.register(dto);
    return {
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        },
        accessToken: result.accessToken,
      },
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginRequestDto) {
    const result = await this.authService.login(dto);
    return {
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        },
        accessToken: result.accessToken,
      },
    };
  }

  @Post('verify-email/:userId')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body('userId') userId: string) {
    const user = await this.authService.verifyEmail(userId);
    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }
}


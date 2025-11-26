import {
  Controller,
  Post,
  Res,
  UseGuards,
  HttpStatus,
  HttpCode,
  Body,
  ValidationPipe,
  UsePipes
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody
} from '@nestjs/swagger';
import { Payload } from '@nestjs/microservices';
import { Response } from 'express';
import {
  AuthServiceController,
  AuthServiceControllerMethods,
  CurrentUser,
  UserDocument,
} from '@app/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

class LoginRequestDto {
  email: string;
  password: string;
}

class LoginResponseDto {
  access_token: string;
}

@ApiTags('auth')
@Controller('auth')
@AuthServiceControllerMethods()
@UseGuards(ThrottlerGuard)
export class AuthController implements AuthServiceController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'User login', description: 'Authenticate user with email and password' })
  @ApiBody({
    type: LoginRequestDto,
    description: 'User login credentials',
    examples: {
      'valid-login': {
        summary: 'Valid login credentials',
        value: {
          email: 'user@example.com',
          password: 'password123'
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
    type: LoginResponseDto
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials'
  })
  async login(
    @CurrentUser() user: UserDocument,
    @Res({ passthrough: true }) response: Response,
  ) {
    const jwt = await this.authService.login(user, response);
    response.send({ access_token: jwt });
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Authenticate user via gRPC',
    description: 'Internal authentication for gRPC microservice communication'
  })
  async authenticate(@Payload() data: any) {
    return {
      ...data.user,
      id: data.user._id,
    };
  }
}

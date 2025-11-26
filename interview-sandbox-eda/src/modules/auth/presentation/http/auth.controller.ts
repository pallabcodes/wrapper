import { Controller, Post, Get, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AuthService } from '../../application/services/auth.service';
import { RegisterUserCommand } from '../../application/commands/register-user.command';
import { RegisterUserRequestDto } from '../dto/register-user.request.dto';
import { UserResponseDto } from '../dto/user.response.dto';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Creates a new user account using Event-Driven Architecture'
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: UserResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() dto: RegisterUserRequestDto): Promise<UserResponseDto> {
    const userId = uuidv4();

    await this.authService.registerUser(
      new RegisterUserCommand(userId, dto.email, dto.name, dto.password, dto.role)
    );

    return {
      id: userId,
      email: dto.email,
      name: dto.name,
      role: dto.role || 'USER',
      isEmailVerified: false,
    };
  }

  @Get('users/:id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieves user information from the read model'
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User found',
    type: UserResponseDto
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id') id: string): Promise<UserResponseDto | null> {
    return this.authService.getUserById(id);
  }

  @Post('users/:id/verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify user email',
    description: 'Verifies user email and triggers email verification event'
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async verifyEmail(@Param('id') id: string): Promise<{ message: string }> {
    await this.authService.verifyUserEmail(id);
    return { message: 'Email verified successfully' };
  }
}

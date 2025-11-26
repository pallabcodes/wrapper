import { Controller, Post, Get, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { RegisterUserUseCase, RegisterUserCommand } from '../../application/use-cases/register-user.use-case';
import { VerifyUserEmailUseCase } from '../../application/use-cases/verify-user-email.use-case';
import { GetUserByIdUseCase } from '../../application/use-cases/get-user-by-id.use-case';
import { RegisterUserRequestDto } from '../dto/register-user.request.dto';
import { UserResponseDto } from '../dto/user.response.dto';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly verifyUserEmailUseCase: VerifyUserEmailUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Creates a new user account using Domain-Driven Design patterns'
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

    const command: RegisterUserCommand = {
      userId,
      email: dto.email,
      name: dto.name,
      password: dto.password,
      role: dto.role,
    };

    const result = await this.registerUserUseCase.execute(command);

    return {
      id: result.userId,
      email: result.email,
      name: result.name,
      role: result.role,
      isEmailVerified: result.isEmailVerified,
    };
  }

  @Get('users/:id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieves user information using DDD query patterns'
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User found',
    type: UserResponseDto
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id') id: string): Promise<UserResponseDto | null> {
    return this.getUserByIdUseCase.execute({ userId: id });
  }

  @Post('users/:id/verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify user email',
    description: 'Verifies user email using DDD command patterns'
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async verifyEmail(@Param('id') id: string): Promise<{ message: string }> {
    await this.verifyUserEmailUseCase.execute({ userId: id });
    return { message: 'Email verified successfully' };
  }
}

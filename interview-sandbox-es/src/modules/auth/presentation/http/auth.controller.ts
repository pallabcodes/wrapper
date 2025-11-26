import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateUserCommand } from '../../application/commands/create-user/create-user.command';
import { CreateUserRequestDto } from '../dto/create-user.request.dto';
import { UserResponseDto } from '../dto/user.response.dto';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: UserResponseDto
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async register(@Body() dto: CreateUserRequestDto): Promise<UserResponseDto> {
    const userId = uuidv4();

    await this.commandBus.execute(
      new CreateUserCommand(userId, dto.email, dto.name, dto.password, dto.role)
    );

    return {
      id: userId,
      email: dto.email,
      name: dto.name,
      role: dto.role || 'USER',
      isEmailVerified: false,
    };
  }
}

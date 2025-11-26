import { Controller, Post, Get, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { RegisterUserCommand } from '../../commands/register-user/register-user.command';
import { GetUserByIdQuery } from '../../queries/get-user-by-id/get-user-by-id.query';
import { RegisterUserRequestDto } from '../dto/register-user.request.dto';
import { UserResponseDto } from '../dto/user.response.dto';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Creates a new user account using CQRS command pattern'
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

    await this.commandBus.execute(
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
    description: 'Retrieves user information using CQRS query pattern'
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User found',
    type: UserResponseDto
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id') id: string): Promise<UserResponseDto | null> {
    const user = await this.queryBus.execute(new GetUserByIdQuery(id));

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    };
  }
}

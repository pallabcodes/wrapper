import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegisterUserUseCase } from '@application/use-cases/register-user.use-case';
import { LoginUserUseCase } from '@application/use-cases/login-user.use-case';
import { RegisterUserRequestDto } from '../dto/register-user.request.dto';
import { LoginUserRequestDto } from '../dto/login-user.request.dto';
import { UserResponseDto } from '../dto/user.response.dto';
import { AuthResponseDto } from '../dto/auth.response.dto';
import { AuthMapper } from '../mappers/auth.mapper';
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
  ) { }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Creates a new user account with email verification. Password must be at least 8 characters with uppercase, lowercase, and number.'
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: UserResponseDto,
    schema: {
      example: {
        id: 'uuid-string',
        email: 'user@example.com',
        name: 'John Doe',
        role: 'USER',
        isEmailVerified: false,
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'User already exists',
    schema: {
      example: {
        statusCode: 409,
        message: 'User with email user@example.com already exists',
        error: 'UserAlreadyExistsException',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
    schema: {
      example: {
        statusCode: 400,
        message: ['email must be an email', 'password must be at least 8 characters'],
        error: 'Bad Request',
      },
    },
  })
  async register(@Body() requestDto: RegisterUserRequestDto): Promise<UserResponseDto> {
    // Transform HTTP DTO to Application DTO
    const dto = AuthMapper.toRegisterDto(requestDto);

    // Delegate to use case (exceptions handled by DomainExceptionFilter)
    const result = await this.registerUserUseCase.execute(dto);

    // Transform Application DTO to HTTP DTO
    return AuthMapper.toUserResponseDto(result);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate user and get tokens',
    description: 'Validates user credentials and returns JWT access and refresh tokens for authenticated requests.'
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
    schema: {
      example: {
        user: {
          id: 'uuid-string',
          email: 'user@example.com',
          name: 'John Doe',
          role: 'USER',
          isEmailVerified: true,
        },
        tokens: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid email or password',
        error: 'InvalidCredentialsException',
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - Rate limited',
    schema: {
      example: {
        statusCode: 429,
        message: 'Too many requests',
        error: 'ThrottlerException',
      },
    },
  })
  async login(@Body() requestDto: LoginUserRequestDto): Promise<AuthResponseDto> {
    // Transform HTTP DTO to Application DTO
    const dto = AuthMapper.toLoginDto(requestDto);

    // Delegate to use case (exceptions handled by DomainExceptionFilter)
    const result = await this.loginUserUseCase.execute(dto);

    // Transform Application DTO to HTTP DTO
    return AuthMapper.toAuthResponseDto(result);
  }
}


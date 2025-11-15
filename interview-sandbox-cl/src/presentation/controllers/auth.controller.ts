import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegisterUserUseCase } from '@application/use-cases/register-user.use-case';
import { LoginUserUseCase } from '@application/use-cases/login-user.use-case';
import { RegisterUserRequestDto } from '../dto/register-user.request.dto';
import { LoginUserRequestDto } from '../dto/login-user.request.dto';
import { UserResponseDto } from '../dto/user.response.dto';
import { AuthMapper } from '../mappers/auth.mapper';
import { UserAlreadyExistsException } from '@domain/exceptions/user-already-exists.exception';
import { InvalidCredentialsException } from '@domain/exceptions/invalid-credentials.exception';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully', type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() requestDto: RegisterUserRequestDto): Promise<UserResponseDto> {
    // Transform HTTP DTO to Application DTO
    const dto = AuthMapper.toRegisterDto(requestDto);

    try {
      // Delegate to use case
      const result = await this.registerUserUseCase.execute(dto);

      // Transform Application DTO to HTTP DTO
      return AuthMapper.toUserResponseDto(result);
    } catch (error) {
      if (error instanceof UserAlreadyExistsException) {
        throw error;
      }
      throw error;
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() requestDto: LoginUserRequestDto): Promise<UserResponseDto> {
    // Transform HTTP DTO to Application DTO
    const dto = AuthMapper.toLoginDto(requestDto);

    try {
      // Delegate to use case
      const result = await this.loginUserUseCase.execute(dto);

      // Transform Application DTO to HTTP DTO
      return AuthMapper.toUserResponseDto(result);
    } catch (error) {
      if (error instanceof InvalidCredentialsException) {
        throw error;
      }
      throw error;
    }
  }
}


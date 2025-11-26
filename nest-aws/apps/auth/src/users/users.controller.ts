import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  HttpStatus,
  HttpCode,
  ValidationPipe,
  UsePipes
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiUnauthorizedResponse,
  ApiConflictResponse
} from '@nestjs/swagger';
import { CurrentUser, UserDocument } from '@app/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUserDto } from './dto/get-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
@UseGuards(ThrottlerGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Create new user',
    description: 'Register a new user account'
  })
  @ApiBody({
    type: CreateUserDto,
    description: 'User registration data',
    examples: {
      'valid-user': {
        summary: 'Valid user registration',
        value: {
          email: 'john.doe@example.com',
          password: 'SecurePass123!',
          name: 'John Doe'
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User created successfully',
    type: GetUserDto
  })
  @ApiConflictResponse({
    description: 'Email already exists'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data'
  })
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current user',
    description: 'Retrieve current authenticated user information'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User information retrieved successfully',
    type: GetUserDto
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - invalid or missing JWT token'
  })
  async getUser(@CurrentUser() user: UserDocument) {
    return user;
  }
}

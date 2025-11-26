import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterUserRequestDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Valid email address for user registration'
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the user',
    minLength: 1,
    maxLength: 100
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'Password must be at least 8 characters with uppercase, lowercase, and number',
    minLength: 8
  })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @ApiPropertyOptional({
    enum: ['USER', 'ADMIN', 'MODERATOR'],
    default: 'USER',
    description: 'User role (defaults to USER)'
  })
  @IsOptional()
  @IsEnum(['USER', 'ADMIN', 'MODERATOR'], { message: 'Role must be USER, ADMIN, or MODERATOR' })
  role?: 'USER' | 'ADMIN' | 'MODERATOR';
}

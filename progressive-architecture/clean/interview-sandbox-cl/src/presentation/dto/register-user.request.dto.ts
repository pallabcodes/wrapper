import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class RegisterUserRequestDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Valid email address for user registration'
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) => value?.toLowerCase()?.trim())
  email: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the user',
    minLength: 1,
    maxLength: 100
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(1, { message: 'Name cannot be empty' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  @Matches(/^[a-zA-Z\s\-'\.]+$/, {
    message: 'Name can only contain letters, spaces, hyphens, apostrophes, and periods'
  })
  name: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'Password must be at least 8 characters with uppercase, lowercase, and number',
    minLength: 8
  })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
  })
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


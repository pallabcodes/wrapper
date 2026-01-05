import { IsEmail, IsString, IsOptional, IsIn, MinLength, MaxLength, Matches } from 'class-validator';

/**
 * Presentation DTO: HTTP Register User Request
 *
 * External HTTP API contract with validation
 * Uses class-validator for automatic validation
 */
export class RegisterUserHttpDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;

  @IsString({ message: 'Username must be a string' })
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(30, { message: 'Username cannot exceed 30 characters' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Username can only contain letters, numbers, underscores, and hyphens'
  })
  username!: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  })
  password!: string;

  @IsOptional()
  @IsIn(['viewer', 'streamer'], {
    message: 'Role must be either "viewer" or "streamer"'
  })
  role?: string;
}

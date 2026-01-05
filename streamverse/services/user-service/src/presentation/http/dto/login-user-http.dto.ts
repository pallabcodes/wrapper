import { IsString, IsNotEmpty, MinLength } from 'class-validator';

/**
 * Presentation DTO: HTTP Login User Request
 *
 * External HTTP API contract for user login
 */
export class LoginUserHttpDto {
  @IsString({ message: 'Email or username must be a string' })
  @IsNotEmpty({ message: 'Email or username is required' })
  @MinLength(1, { message: 'Email or username cannot be empty' })
  emailOrUsername!: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(1, { message: 'Password cannot be empty' })
  password!: string;
}

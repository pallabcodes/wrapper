/**
 * Application DTO: Register
 * 
 * Data transfer object for user registration use case
 * Used in Application layer (use cases)
 */
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(8)
  password: string;
}


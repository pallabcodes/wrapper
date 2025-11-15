/**
 * Presentation DTO: Register Request
 * 
 * Used for HTTP request validation
 */
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterRequestDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  name: string;
}


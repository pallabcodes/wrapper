/**
 * Application DTO: Login
 * 
 * Data transfer object for user login use case
 */
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}


/**
 * Register User DTO
 * 
 * Validates user registration input
 */
export class RegisterDto {
  email: string;
  password: string;
  roles?: string[];
}


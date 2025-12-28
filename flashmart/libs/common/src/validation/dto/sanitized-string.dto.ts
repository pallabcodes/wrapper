import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

/**
 * Base class for sanitized string inputs
 * Provides XSS protection and input validation
 */
export class SanitizedStringDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;

    // Basic XSS protection - remove dangerous HTML/script tags
    return value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  })
  value: string;
}

/**
 * Email validation DTO with sanitization
 */
export class SanitizedEmailDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*@[^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*$/, {
    message: 'Invalid email format'
  })
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    return value.toLowerCase().trim();
  })
  email: string;
}

/**
 * Password validation DTO with strength requirements
 */
export class SanitizedPasswordDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must be no more than 128 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  })
  password: string;
}

/**
 * Name validation DTO with sanitization
 */
export class SanitizedNameDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name must be no more than 100 characters long' })
  @Matches(/^[a-zA-Z\s\-'\.]+$/, {
    message: 'Name can only contain letters, spaces, hyphens, apostrophes, and periods'
  })
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    return value.trim().replace(/\s+/g, ' '); // Normalize whitespace
  })
  name: string;
}

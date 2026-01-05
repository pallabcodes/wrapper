import { IsString, IsNotEmpty } from 'class-validator';

/**
 * Presentation Layer: HTTP Refresh Token DTO
 *
 * Protocol-specific validation for refresh token requests
 */
export class RefreshTokenHttpDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

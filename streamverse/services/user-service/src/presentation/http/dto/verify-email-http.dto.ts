import { IsString, IsNotEmpty, MinLength } from 'class-validator';

/**
 * Presentation DTO: HTTP Verify Email Request
 *
 * External HTTP API request format for email verification
 * Validates incoming request data
 */
export class VerifyEmailHttpDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Token must be at least 10 characters long' })
  token!: string;
}

/**
 * Presentation DTO: HTTP Verify Email Response
 *
 * External HTTP API response format for email verification
 */
export class VerifyEmailHttpResponse {
  constructor(
    public readonly message: string,
    public readonly email: string,
    public readonly verifiedAt: Date
  ) {}

  static fromAppDto(appDto: { message: string; email: string; verifiedAt: Date }): VerifyEmailHttpResponse {
    return new VerifyEmailHttpResponse(
      appDto.message,
      appDto.email,
      appDto.verifiedAt
    );
  }
}

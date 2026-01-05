import { Expose, Transform } from 'class-transformer';

/**
 * Presentation Layer: HTTP Refresh Token Response DTO
 *
 * Protocol-specific response format for refresh token operations
 */
export class RefreshTokenHttpResponse {
  @Expose()
  accessToken!: string;

  @Expose()
  refreshToken!: string;

  @Expose()
  @Transform(({ value }) => value || 3600)
  expiresIn!: number;

  @Expose()
  tokenType!: string;

  constructor() {
    this.tokenType = 'Bearer';
  }

  static fromAppDto(appDto: { accessToken: string; refreshToken: string; expiresIn: number }): RefreshTokenHttpResponse {
    const response = new RefreshTokenHttpResponse();
    response.accessToken = appDto.accessToken;
    response.refreshToken = appDto.refreshToken;
    response.expiresIn = appDto.expiresIn;
    return response;
  }
}

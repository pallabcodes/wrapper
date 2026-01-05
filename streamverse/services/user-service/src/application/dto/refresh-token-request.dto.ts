/**
 * Application Layer: Refresh Token Request DTO
 *
 * Clean internal contract for refresh token requests
 */
export class RefreshTokenRequest {
  constructor(public readonly refreshToken: string) {}

  /**
   * 🏭 FACTORY: Create from HTTP DTO (Presentation → Application)
   * Simple, direct naming - creates Application DTO from HTTP DTO
   * No overcomplication - reflects actual usage and purpose
   */
  static fromHttpDto(httpDto: { refreshToken: string }): RefreshTokenRequest {
    return new RefreshTokenRequest(httpDto.refreshToken);
  }
}

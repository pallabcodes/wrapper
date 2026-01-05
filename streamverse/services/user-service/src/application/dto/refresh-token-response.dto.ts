/**
 * Application Layer: Refresh Token Response DTO
 *
 * Clean internal contract for refresh token responses
 */
export class RefreshTokenResponse {
  constructor(
    public readonly accessToken: string,
    public readonly refreshToken: string,
    public readonly expiresIn: number
  ) {}
}

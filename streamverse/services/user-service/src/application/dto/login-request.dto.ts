/**
 * Application DTO: Login Request
 *
 * Internal request for user authentication
 */
export class LoginRequest {
  constructor(
    public readonly emailOrUsername: string,
    public readonly password: string
  ) {}

  /**
   * 🏭 FACTORY: Create from HTTP DTO (Presentation → Application)
   * Simple, direct naming - creates Application DTO from HTTP DTO
   * No overcomplication - reflects actual usage and purpose
   */
  static fromHttpDto(httpDto: {
    emailOrUsername: string;
    password: string;
  }): LoginRequest {
    return new LoginRequest(
      httpDto.emailOrUsername,
      httpDto.password
    );
  }
}

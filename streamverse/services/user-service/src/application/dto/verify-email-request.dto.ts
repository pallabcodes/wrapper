/**
 * Application DTO: Verify Email Request
 *
 * Internal request for email verification use case
 */
export class VerifyEmailRequest {
  constructor(public readonly token: string) {}

  /**
   * 🏭 FACTORY: Create from HTTP DTO (Presentation → Application)
   * Simple, direct naming - creates Application DTO from HTTP DTO
   * No overcomplication - reflects actual usage and purpose
   */
  static fromHttpDto(httpDto: { token: string }): VerifyEmailRequest {
    return new VerifyEmailRequest(httpDto.token);
  }
}

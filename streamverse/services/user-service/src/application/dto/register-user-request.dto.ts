/**
 * Application DTO: Register User Request
 *
 * Internal request for user registration
 * Contains validated and processed data from presentation layer
 */
export class RegisterUserRequest {
  constructor(
    public readonly email: string,
    public readonly username: string,
    public readonly password: string,
    public readonly role?: string
  ) { }

  /**
   * 🏭 FACTORY: Create from HTTP DTO (Presentation → Application)
   * Simple, direct naming - creates Application DTO from HTTP DTO
   * No overcomplication - reflects actual usage and purpose
   */
  static fromHttpDto(httpDto: {
    email: string;
    username: string;
    password: string;
    role?: string;
  }): RegisterUserRequest {
    // 🎯 BUSINESS LOGIC: Normalization, defaults, validation
    const normalizedEmail = httpDto.email.toLowerCase().trim();
    const normalizedUsername = httpDto.username.trim();
    const defaultRole = httpDto.role || 'viewer';

    // 🚫 BUSINESS RULE EXAMPLE: Could add disposable email validation here
    // if (isDisposableEmail(normalizedEmail)) {
    //   throw new Error('Disposable email addresses are not allowed');
    // }

    return new RegisterUserRequest(
      normalizedEmail,
      normalizedUsername,
      httpDto.password, // Keep password as-is for hashing
      defaultRole
    );
  }

  /**
   * 🔄 TRANSFORM: Convert to plain object (for testing/serialization)
   */
  toPlain(): { email: string; username: string; password: string; role?: string } {
    return {
      email: this.email,
      username: this.username,
      password: this.password,
      role: this.role,
    };
  }
}

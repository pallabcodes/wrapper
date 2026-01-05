import { UserHttpResponse } from './user-http-response.dto';
import { LoginResponse } from '../../../application/dto/login-response.dto';

/**
 * Presentation DTO: HTTP Login Response
 *
 * External HTTP API response for successful login
 */
export class LoginHttpResponse {
  constructor(
    public readonly user: UserHttpResponse,
    public readonly accessToken: string,
    public readonly refreshToken: string,
    public readonly expiresIn: number,
    public readonly tokenType: string = 'Bearer'
  ) {}

  static fromAppDto(appDto: LoginResponse): LoginHttpResponse {
    return new LoginHttpResponse(
      UserHttpResponse.fromAppDto(appDto.user),
      appDto.accessToken,
      appDto.refreshToken,
      appDto.expiresIn
    );
  }
}

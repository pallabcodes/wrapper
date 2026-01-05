import { UserResponse } from './user-response.dto';

/**
 * Application DTO: Login Response
 *
 * Internal response for successful authentication
 */
export class LoginResponse {
  constructor(
    public readonly user: UserResponse,
    public readonly accessToken: string,
    public readonly refreshToken: string,
    public readonly expiresIn: number
  ) {}
}

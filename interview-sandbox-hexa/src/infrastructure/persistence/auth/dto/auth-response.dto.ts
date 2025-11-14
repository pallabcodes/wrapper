/**
 * Authentication Response DTO
 * 
 * Standard response format for authentication endpoints
 */
export class AuthResponseDto {
  user: {
    id: string;
    email: string;
    roles?: string[];
  };

  accessToken: string;

  refreshToken: string;
}


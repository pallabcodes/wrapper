import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { JwtPayload } from './jwt.strategy';
import { AUTH_CONFIG } from '../config/auth.config';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class JwtService {
  constructor(private readonly jwtService: NestJwtService) {}

  async generateTokens(userId: string, email: string, role: string): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: userId,
      email,
      role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: AUTH_CONFIG.JWT.ACCESS_TOKEN_EXPIRATION }),
      this.jwtService.signAsync(payload, { expiresIn: AUTH_CONFIG.JWT.REFRESH_TOKEN_EXPIRATION }),
    ]);

    return { accessToken, refreshToken };
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync(token);
  }
}

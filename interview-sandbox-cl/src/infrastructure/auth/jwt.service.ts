import { Inject, Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { JwtPayload } from './jwt.strategy';
import { AUTH_CONFIG_TOKEN, AuthConfig } from '../config/auth.config';
import type { JwtSignOptions } from '@nestjs/jwt';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class JwtService {
  constructor(
    private readonly jwtService: NestJwtService,
    @Inject(AUTH_CONFIG_TOKEN) private readonly authConfig: AuthConfig,
  ) {}

  async generateTokens(userId: string, email: string, role: string): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: userId,
      email,
      role,
    };

    const accessOpts: JwtSignOptions = { expiresIn: this.authConfig.JWT.ACCESS_TOKEN_EXPIRATION as any };
    const refreshOpts: JwtSignOptions = { expiresIn: this.authConfig.JWT.REFRESH_TOKEN_EXPIRATION as any };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, accessOpts),
      this.jwtService.signAsync(payload, refreshOpts),
    ]);

    return { accessToken, refreshToken };
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync(token);
  }
}

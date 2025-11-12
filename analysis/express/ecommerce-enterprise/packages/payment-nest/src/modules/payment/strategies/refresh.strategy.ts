import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import type { Request } from 'express';
import { eitherFrom, getRefreshTokenFromCookie, getBearerFromHeader } from '@ecommerce-enterprise/nest-enterprise-auth';

function extractor(req: Request): string | null {
  return eitherFrom(
    (r) => getRefreshTokenFromCookie(r, 'refresh_token'),
    getBearerFromHeader,
  )(req);
}

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(JwtStrategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: extractor,
      secretOrKey: process.env.REFRESH_JWT_SECRET || process.env.JWT_SECRET || 'dev_refresh_secret',
      ignoreExpiration: false,
      passReqToCallback: false,
    });
  }

  validate(payload: any) {
    return payload;
  }
}



import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

/**
 * JWT Strategy
 * 
 * Validates JWT tokens from Authorization header
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    });
  }

  async validate(payload: any) {
    // Note: Token blacklist check happens in JwtAuthGuard
    // since we don't have access to the request here
    
    return {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles || [],
      claims: payload.claims || [],
    };
  }
}


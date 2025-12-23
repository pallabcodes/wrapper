import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  roles?: string[];
  permissions?: string[];
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      issuer: configService.get<string>('JWT_ISSUER'),
      audience: configService.get<string>('JWT_AUDIENCE'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    try {
      // Validate required fields
      if (!payload.sub || !payload.email) {
        this.logger.warn('JWT payload missing required fields', {
          hasSub: !!payload.sub,
          hasEmail: !!payload.email,
        });
        throw new UnauthorizedException('Invalid JWT payload');
      }

      // Validate token expiration (additional check)
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        this.logger.warn('JWT token has expired', {
          userId: payload.sub,
          exp: payload.exp,
          now: Math.floor(Date.now() / 1000),
        });
        throw new UnauthorizedException('JWT token has expired');
      }

      // Validate issuer
      const expectedIssuer = this.configService.get<string>('JWT_ISSUER');
      if (expectedIssuer && payload.iss !== expectedIssuer) {
        this.logger.warn('JWT issuer mismatch', {
          expected: expectedIssuer,
          received: payload.iss,
        });
        throw new UnauthorizedException('Invalid JWT issuer');
      }

      // Validate audience
      const expectedAudience = this.configService.get<string>('JWT_AUDIENCE');
      if (expectedAudience && payload.aud !== expectedAudience) {
        this.logger.warn('JWT audience mismatch', {
          expected: expectedAudience,
          received: payload.aud,
        });
        throw new UnauthorizedException('Invalid JWT audience');
      }

      // Return user object that will be attached to request.user
      const user = {
        id: payload.sub,
        email: payload.email,
        roles: payload.roles || [],
        permissions: payload.permissions || [],
        iat: payload.iat || 0,
        exp: payload.exp || 0,
      };

      this.logger.debug('JWT validation successful', {
        userId: user.id,
        roles: user.roles,
        permissionsCount: user.permissions.length,
      });

      return user;
    } catch (error) {
      this.logger.error('JWT validation failed', {
        error: error instanceof Error ? error.message : String(error),
        userId: payload?.sub,
      });

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid JWT token');
    }
  }
}

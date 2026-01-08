
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key', // Fallback for dev
        });
    }

    async validate(payload: any) {
        // This payload is what is returned from the verify() method of JwtService
        // We attach it to the Request object as 'req.user'
        if (!payload) {
            throw new UnauthorizedException();
        }
        return { id: payload.sub, email: payload.email, role: payload.role };
    }
}

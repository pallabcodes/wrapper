import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Inject } from '@nestjs/common';
import { IAuthService, AUTH_SERVICE } from '../../domain/ports/auth-service.port';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        @Inject(AUTH_SERVICE)
        private readonly authService: IAuthService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException('Access token not found');
        }

        try {
            // Verify token and get payload
            const payload = await this.authService.verifyToken(token);

            if (!payload) {
                throw new UnauthorizedException('Invalid access token');
            }

            // We attach the payload (userId, email, role) to the request object
            // so controllers can access it
            request['user'] = payload;

            return true;
        } catch (error) {
            throw new UnauthorizedException('Invalid access token');
        }
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}

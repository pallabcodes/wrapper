import { Injectable, NestMiddleware, UnauthorizedException, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '@flashmart/common';
import * as jwt from 'jsonwebtoken';

export interface JwtPayload {
    sub: string;
    email: string;
    roles?: string[];
    iat?: number;
    exp?: number;
}

export interface AuthenticatedRequest extends Request {
    user?: JwtPayload;
    apiKey?: string;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    private readonly jwtSecret: string;
    private readonly publicPaths = [
        '/health',
        '/ready',
        '/metrics',
        '/.well-known',
        '/graphql', // GraphQL introspection (can be restricted in production)
    ];

    constructor(
        private readonly config: ConfigService,
        @Inject(AuditService)
        private readonly auditService: AuditService,
    ) {
        this.jwtSecret = config.get('JWT_SECRET', 'flashmart-dev-secret');
    }

    async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        // Skip auth for public paths
        if (this.isPublicPath(req.path)) {
            return next();
        }

        const ipAddress = this.getClientIp(req);
        const userAgent = req.headers['user-agent'];
        const correlationId = req.headers['x-correlation-id'] as string;

        // Try API Key first (for service-to-service)
        const apiKey = req.headers['x-api-key'] as string;
        if (apiKey) {
            const isValid = this.validateApiKey(apiKey);
            await this.auditService.logAuthentication(
                null,
                isValid,
                ipAddress,
                userAgent,
                correlationId,
                { method: 'api_key', resource: req.path },
            );

            if (isValid) {
                req.apiKey = apiKey;
                return next();
            }
        }

        // Try JWT Bearer token
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            await this.auditService.logAuthentication(
                null,
                false,
                ipAddress,
                userAgent,
                correlationId,
                { method: 'jwt', reason: 'missing_header', resource: req.path },
            );
            throw new UnauthorizedException('Missing authorization header');
        }

        const [scheme, token] = authHeader.split(' ');
        if (scheme !== 'Bearer' || !token) {
            await this.auditService.logAuthentication(
                null,
                false,
                ipAddress,
                userAgent,
                correlationId,
                { method: 'jwt', reason: 'invalid_format', resource: req.path },
            );
            throw new UnauthorizedException('Invalid authorization format. Use: Bearer <token>');
        }

        try {
            const payload = jwt.verify(token, this.jwtSecret) as JwtPayload;
            req.user = payload;

            await this.auditService.logAuthentication(
                payload.sub,
                true,
                ipAddress,
                userAgent,
                correlationId,
                { method: 'jwt', resource: req.path },
            );

            next();
        } catch (error) {
            const reason = error.name === 'TokenExpiredError' ? 'token_expired' : 'invalid_token';
            await this.auditService.logAuthentication(
                null,
                false,
                ipAddress,
                userAgent,
                correlationId,
                { method: 'jwt', reason, resource: req.path },
            );

            if (error.name === 'TokenExpiredError') {
                throw new UnauthorizedException('Token expired');
            }
            throw new UnauthorizedException('Invalid token');
        }
    }

    private isPublicPath(path: string): boolean {
        return this.publicPaths.some(p => path.startsWith(p));
    }

    private validateApiKey(apiKey: string): boolean {
        // In production: validate against database or secret manager
        const validKeys = this.config.get('API_KEYS', 'service-key-1,service-key-2').split(',');
        return validKeys.includes(apiKey);
    }

    private getClientIp(req: Request): string {
        const forwarded = req.headers['x-forwarded-for'] as string;
        return forwarded ? forwarded.split(',')[0].trim() : req.ip || 'unknown';
    }
}

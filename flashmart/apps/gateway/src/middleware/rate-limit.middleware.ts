import { Injectable, NestMiddleware, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RateLimitService, AuditService } from '@flashmart/common';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
    constructor(
        @Inject(RateLimitService)
        private readonly rateLimitService: RateLimitService,
        @Inject(AuditService)
        private readonly auditService: AuditService,
    ) {}

    async use(req: Request, res: Response, next: NextFunction) {
        const clientId = this.getClientId(req);
        const tier = this.getClientTier(req);
        const ipAddress = this.getClientIp(req);
        const userAgent = req.headers['user-agent'] as string;
        const correlationId = req.headers['x-correlation-id'] as string;

        const result = await this.rateLimitService.checkLimit(clientId, tier);
        const config = this.rateLimitService.getTierConfig(tier);

        if (!result.allowed) {
            // Log rate limit violation
            await this.auditService.logRateLimit(
                clientId,
                ipAddress,
                userAgent,
                correlationId,
            );

            res.setHeader('X-RateLimit-Limit', config.maxRequests);
            res.setHeader('X-RateLimit-Remaining', 0);
            res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
            res.setHeader('Retry-After', result.retryAfter || 60);

            throw new HttpException(
                {
                    statusCode: HttpStatus.TOO_MANY_REQUESTS,
                    message: 'Too many requests. Please try again later.',
                    retryAfter: result.retryAfter,
                },
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        res.setHeader('X-RateLimit-Limit', config.maxRequests);
        res.setHeader('X-RateLimit-Remaining', result.remaining);
        res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

        next();
    }

    private getClientId(req: Request): string {
        // Priority: User ID > API Key > IP
        const user = (req as any).user;
        if (user?.sub) return `user:${user.sub}`;

        const apiKey = req.headers['x-api-key'];
        if (apiKey) return `apikey:${apiKey}`;

        const forwarded = req.headers['x-forwarded-for'] as string;
        const ip = forwarded ? forwarded.split(',')[0].trim() : req.ip;
        return `ip:${ip}`;
    }

    private getClientTier(req: Request): string {
        const user = (req as any).user;
        if (!user) return 'anonymous';
        if (user.roles?.includes('premium')) return 'premium';
        if (user.roles?.includes('internal')) return 'internal';
        return 'authenticated';
    }

    private getClientIp(req: Request): string {
        const forwarded = req.headers['x-forwarded-for'] as string;
        return forwarded ? forwarded.split(',')[0].trim() : req.ip || 'unknown';
    }

}

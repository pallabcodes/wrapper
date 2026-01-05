import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { Email } from '../../domain/value-objects/email.vo';
import { INotificationService, NOTIFICATION_SERVICE } from '../../domain/ports/notification-service.port';
import { RedisTokenService } from '../../infrastructure/cache/redis-token.service';

/**
 * Application Use Case: Request Magic Link
 *
 * Generates a one-time login link and sends it via email
 * - Creates secure random token
 * - Stores token → email mapping in Redis with TTL
 * - Sends magic link email
 * - Always returns success (prevents email enumeration)
 */
@Injectable()
export class RequestMagicLinkUseCase {
    constructor(
        @Inject(NOTIFICATION_SERVICE)
        private readonly notificationService: INotificationService,
        private readonly redisTokenService: RedisTokenService,
        private readonly configService: ConfigService,
    ) { }

    async execute(request: RequestMagicLinkRequest): Promise<RequestMagicLinkResponse> {
        const email = Email.create(request.email);

        // Generate secure random token (32 bytes = 64 hex chars)
        const token = randomBytes(32).toString('hex');

        // Get TTL from config (default 5 minutes)
        const ttlSeconds = this.configService.get<number>('MAGIC_LINK_TTL_SECONDS', 300);

        // Store token → email mapping in Redis
        await this.redisTokenService.storeMagicLinkToken(token, email.getValue(), ttlSeconds);

        // Build magic link URL
        const baseUrl = this.configService.get<string>(
            'MAGIC_LINK_BASE_URL',
            'http://localhost:3001/users/auth/magic-link/verify',
        );
        const magicLinkUrl = `${baseUrl}?token=${token}`;

        // Send magic link email via notification service
        await this.notificationService.sendMagicLink(email, magicLinkUrl);

        // Always return success to prevent email enumeration
        return {
            message: 'If an account exists, a magic link has been sent to your email',
            expiresInSeconds: ttlSeconds,
        };
    }
}

export interface RequestMagicLinkRequest {
    email: string;
}

export interface RequestMagicLinkResponse {
    message: string;
    expiresInSeconds: number;
}

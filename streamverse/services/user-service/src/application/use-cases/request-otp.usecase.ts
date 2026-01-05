import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomInt } from 'crypto';
import { INotificationService, NOTIFICATION_SERVICE } from '../../domain/ports/notification-service.port';
import { RedisTokenService } from '../../infrastructure/cache/redis-token.service';

/**
 * Application Use Case: Request OTP
 *
 * Generates a one-time password (OTP) and sends it via Email or SMS
 * - Generates secure 6-digit numeric code
 * - Stores code in Redis with TTL (default 5 min)
 * - Emits event to notification service
 */
@Injectable()
export class RequestOtpUseCase {
    constructor(
        @Inject(NOTIFICATION_SERVICE)
        private readonly notificationService: INotificationService,
        private readonly redisTokenService: RedisTokenService,
        private readonly configService: ConfigService,
    ) { }

    async execute(request: RequestOtpRequest): Promise<RequestOtpResponse> {
        const { identifier, type } = request;

        if (!identifier) {
            throw new BadRequestException('Identifier (email or phone) is required');
        }

        // Basic format validation
        if (type === 'email' && !identifier.includes('@')) {
            throw new BadRequestException('Invalid email format');
        }
        if (type === 'sms' && !/^\+?[1-9]\d{1,14}$/.test(identifier)) {
            // E.164-ish regex for standard phone numbers (e.g. +14155552671)
            throw new BadRequestException('Invalid phone format (E.164 required, e.g. +14155552671)');
        }

        // Generate 6-digit OTP (secure random)
        const otp = randomInt(100000, 999999).toString();

        // Get TTL from config (default 5 minutes)
        const ttlSeconds = this.configService.get<number>('OTP_TTL_SECONDS', 300);

        // Store OTP in Redis
        await this.redisTokenService.storeOtp(identifier, otp, ttlSeconds);

        // Send Notification
        await this.notificationService.sendOtp(identifier, otp, type);

        return {
            message: `OTP sent to ${identifier}`,
            expiresInSeconds: ttlSeconds,
        };
    }
}

export interface RequestOtpRequest {
    identifier: string; // Email or Phone Number
    type: 'email' | 'sms';
}

export interface RequestOtpResponse {
    message: string;
    expiresInSeconds: number;
}

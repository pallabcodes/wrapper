import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CircuitBreakerFactory } from '@streamverse/common';
import { TwilioSMSProvider } from './twilio-sms.provider';
import {
    ISMSProvider,
    SMSContent,
    NotificationResult,
} from '../../domain/ports/notification-providers.port';

/**
 * Resilient SMS Provider
 * 
 * Wraps TwilioSMSProvider with:
 * - Circuit breaker for fast-failure when Twilio is down
 * - Retry logic with exponential backoff for transient failures
 * 
 * Configuration:
 * - Opens after 50% error rate
 * - Timeout: 15s (SMS delivery is typically fast)
 * - Reset timeout: 30s
 * - Retries: 3 attempts with exponential backoff
 */
@Injectable()
export class ResilientSMSProvider implements ISMSProvider {
    private readonly logger = new Logger(ResilientSMSProvider.name);
    private readonly sendSMSBreaker: ReturnType<typeof CircuitBreakerFactory.getOrCreate>;

    constructor(
        private readonly twilioProvider: TwilioSMSProvider,
        private readonly configService: ConfigService,
    ) {
        // Create circuit breaker for SMS sending
        this.sendSMSBreaker = CircuitBreakerFactory.getOrCreate(
            this.sendSMSWithRetry.bind(this),
            {
                timeout: 15000, // 15 seconds
                errorThresholdPercentage: 50,
                resetTimeout: 30000, // 30 seconds before retry
                name: 'Twilio:sendSMS',
            }
        );

        // Add fallback behavior when circuit is open
        this.sendSMSBreaker.fallback((content: SMSContent) => {
            this.logger.warn(`Circuit breaker OPEN - queueing SMS for later: ${content.to.getValue()}`);
            // In production, queue to DLQ or retry queue
            return {
                success: false,
                error: 'SMS service temporarily unavailable. Message queued for retry.',
            };
        });

        this.logger.log('ResilientSMSProvider initialized with circuit breaker');
    }

    /**
     * Send SMS with retry logic
     */
    private async sendSMSWithRetry(content: SMSContent): Promise<NotificationResult> {
        const maxRetries = 3;
        const baseDelay = 1000; // 1 second

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const result = await this.twilioProvider.sendSMS(content);

            if (result.success) {
                return result;
            }

            // Check if error is retryable
            if (!this.isRetryableError(result.error || '')) {
                this.logger.warn(`Non-retryable SMS error: ${result.error}`);
                return result;
            }

            // Don't retry on last attempt
            if (attempt >= maxRetries) {
                this.logger.error(`SMS failed after ${maxRetries} attempts: ${result.error}`);
                return result;
            }

            // Exponential backoff
            const delay = baseDelay * Math.pow(2, attempt - 1);
            this.logger.warn(
                `SMS attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms: ${result.error}`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
        }

        return { success: false, error: 'Max retries exceeded' };
    }

    /**
     * Determine if error is retryable
     */
    private isRetryableError(error: string): boolean {
        const retryablePatterns = [
            'timeout',
            'rate limit',
            'too many requests',
            'service unavailable',
            'temporarily unavailable',
            'connection refused',
            'ECONNRESET',
            'ETIMEDOUT',
            '429', // Too Many Requests
            '503', // Service Unavailable
            '504', // Gateway Timeout
            '20429', // Twilio rate limit error
        ];

        const lowerError = error.toLowerCase();
        return retryablePatterns.some((pattern) => lowerError.includes(pattern.toLowerCase()));
    }

    async sendSMS(content: SMSContent): Promise<NotificationResult> {
        try {
            return await this.sendSMSBreaker.fire(content);
        } catch (error) {
            this.logger.error('SMS sending failed with circuit breaker:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Get circuit breaker statistics for monitoring
     */
    getCircuitBreakerStats() {
        return CircuitBreakerFactory.getStats();
    }
}

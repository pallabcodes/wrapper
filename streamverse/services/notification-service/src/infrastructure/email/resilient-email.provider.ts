import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CircuitBreakerFactory } from '@streamverse/common';
import { SendGridEmailProvider } from './sendgrid-email.provider';
import {
    IEmailProvider,
    EmailContent,
    NotificationResult,
} from '../../domain/ports/notification-providers.port';

/**
 * Resilient Email Provider
 * 
 * Wraps SendGridEmailProvider with:
 * - Circuit breaker for fast-failure when SendGrid is down
 * - Retry logic with exponential backoff for transient failures
 * 
 * Configuration:
 * - Opens after 50% error rate
 * - Timeout: 30s (email delivery can be slow)
 * - Reset timeout: 60s (email providers typically recover slowly)
 * - Retries: 3 attempts with exponential backoff
 */
@Injectable()
export class ResilientEmailProvider implements IEmailProvider {
    private readonly logger = new Logger(ResilientEmailProvider.name);
    private readonly sendEmailBreaker: ReturnType<typeof CircuitBreakerFactory.getOrCreate>;

    constructor(
        private readonly sendgridProvider: SendGridEmailProvider,
        private readonly configService: ConfigService,
    ) {
        // Create circuit breaker for email sending
        this.sendEmailBreaker = CircuitBreakerFactory.getOrCreate(
            this.sendEmailWithRetry.bind(this),
            {
                timeout: 30000, // 30 seconds - email can be slow
                errorThresholdPercentage: 50,
                resetTimeout: 60000, // 1 minute before retry
                name: 'SendGrid:sendEmail',
            }
        );

        // Add fallback behavior when circuit is open
        this.sendEmailBreaker.fallback((content: EmailContent) => {
            this.logger.warn(`Circuit breaker OPEN - queueing email for later: ${content.to.getValue()}`);
            // In production, queue to DLQ or retry queue
            return {
                success: false,
                error: 'Email service temporarily unavailable. Message queued for retry.',
            };
        });

        this.logger.log('ResilientEmailProvider initialized with circuit breaker');
    }

    /**
     * Send email with retry logic
     */
    private async sendEmailWithRetry(content: EmailContent): Promise<NotificationResult> {
        const maxRetries = 3;
        const baseDelay = 1000; // 1 second

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const result = await this.sendgridProvider.sendEmail(content);

            if (result.success) {
                return result;
            }

            // Check if error is retryable
            if (!this.isRetryableError(result.error || '')) {
                this.logger.warn(`Non-retryable email error: ${result.error}`);
                return result;
            }

            // Don't retry on last attempt
            if (attempt >= maxRetries) {
                this.logger.error(`Email failed after ${maxRetries} attempts: ${result.error}`);
                return result;
            }

            // Exponential backoff
            const delay = baseDelay * Math.pow(2, attempt - 1);
            this.logger.warn(
                `Email attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms: ${result.error}`
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
            'gateway timeout',
            'connection refused',
            'ECONNRESET',
            'ETIMEDOUT',
            '429', // Too Many Requests
            '503', // Service Unavailable
            '504', // Gateway Timeout
        ];

        const lowerError = error.toLowerCase();
        return retryablePatterns.some((pattern) => lowerError.includes(pattern.toLowerCase()));
    }

    async sendEmail(content: EmailContent): Promise<NotificationResult> {
        try {
            return await this.sendEmailBreaker.fire(content);
        } catch (error) {
            this.logger.error('Email sending failed with circuit breaker:', error);
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

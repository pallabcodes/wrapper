import { SetMetadata } from '@nestjs/common';
import { PaymentProvider, ComplianceOptions, FraudDetectionOptions } from '../interfaces/payment-options.interface';

export const PAYMENT_PROVIDER_KEY = 'payment:provider';
export const PAYMENT_FRAUD_KEY = 'payment:fraud';
export const PAYMENT_COMPLIANCE_KEY = 'payment:compliance';
export const PAYMENT_WEBHOOK_KEY = 'payment:webhook';

/**
 * Decorator to specify payment provider for a method
 */
export const UseProvider = (provider: PaymentProvider) => SetMetadata(PAYMENT_PROVIDER_KEY, provider);

/**
 * Decorator to enable fraud detection
 */
export const EnableFraudDetection = (options?: Partial<FraudDetectionOptions>) => 
  SetMetadata(PAYMENT_FRAUD_KEY, { enabled: true, ...options });

/**
 * Decorator to disable fraud detection
 */
export const DisableFraudDetection = () => SetMetadata(PAYMENT_FRAUD_KEY, { enabled: false });

/**
 * Decorator to enable compliance features
 */
export const EnableCompliance = (options?: Partial<ComplianceOptions>) => 
  SetMetadata(PAYMENT_COMPLIANCE_KEY, { ...options });

/**
 * Decorator to enable 3D Secure
 */
export const Enable3DSecure = () => SetMetadata(PAYMENT_COMPLIANCE_KEY, { threeDSecure: true });

/**
 * Decorator to enable Strong Customer Authentication (SCA)
 */
export const EnableSCA = () => SetMetadata(PAYMENT_COMPLIANCE_KEY, { sca: true });

/**
 * Decorator to enable data retention
 */
export const EnableDataRetention = (periodDays?: number) => 
  SetMetadata(PAYMENT_COMPLIANCE_KEY, { 
    dataRetention: { enabled: true, periodDays: periodDays || 365 } 
  });

/**
 * Decorator to mark method as webhook handler
 */
export const WebhookHandler = (eventType?: string) => 
  SetMetadata(PAYMENT_WEBHOOK_KEY, { eventType });

/**
 * Decorator to enable payment logging
 */
export const LogPayment = (level: 'debug' | 'info' | 'warn' | 'error' = 'info') => 
  SetMetadata('payment:logging', { level });

/**
 * Decorator to set payment timeout
 */
export const PaymentTimeout = (timeout: number) => SetMetadata('payment:timeout', timeout);

/**
 * Decorator to enable payment retry
 */
export const EnableRetry = (maxRetries: number = 3) => SetMetadata('payment:retry', { maxRetries });

/**
 * Decorator to set payment priority
 */
export const PaymentPriority = (priority: number) => SetMetadata('payment:priority', priority);

/**
 * Enterprise Payment Service
 * 
 * Advanced payment processing with fraud detection, compliance,
 * real-time monitoring, and enterprise-grade features.
 */

import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentRepository } from '../repositories/payment.repository';
import { PaymentService } from './payment.service';
import { StripeService } from './stripe.service';
import { BraintreeService } from './braintree.service';
import { PayPalService } from './paypal.service';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { PaymentResponseDto } from '../dto/payment-response.dto';
import { PaymentListResponseDto } from '../dto/payment-list-response.dto';
import { Payment, PaymentStatus, PaymentProvider } from '../entities/payment.entity';
import { EnterpriseZodValidationService } from '@ecommerce-enterprise/nest-zod';
import { z } from 'zod';

// Enterprise Payment Schemas with Advanced Validation
export const EnterprisePaymentSchema = z.object({
  amount: z.number().positive('Amount must be positive').max(999999.99, 'Amount too high'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  provider: z.enum(['stripe', 'braintree', 'paypal', 'square', 'adyen'], {
    errorMap: () => ({ message: 'Invalid payment provider' })
  }),
  method: z.enum(['card', 'bank_transfer', 'wallet', 'cryptocurrency'], {
    errorMap: () => ({ message: 'Invalid payment method' })
  }),
  customerEmail: z.string().email('Invalid customer email'),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  metadata: z.record(z.unknown()).optional(),
  billingAddress: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'ZIP code is required'),
    country: z.string().length(2, 'Country code must be 2 characters'),
  }).optional(),
  fraudDetection: z.object({
    enabled: z.boolean().default(true),
    riskThreshold: z.number().min(0).max(1).default(0.7),
    customRules: z.array(z.string()).optional(),
  }).optional(),
  compliance: z.object({
    pciCompliant: z.boolean().default(true),
    gdprCompliant: z.boolean().default(true),
    auditTrail: z.boolean().default(true),
    dataRetention: z.number().int().min(30).max(2555).default(2555), // 7 years in days
  }).optional(),
  retryPolicy: z.object({
    maxRetries: z.number().int().min(0).max(5).default(3),
    retryDelay: z.number().int().min(1000).max(30000).default(5000),
    exponentialBackoff: z.boolean().default(true),
  }).optional(),
});

export type EnterprisePaymentData = z.infer<typeof EnterprisePaymentSchema>;

export const FraudDetectionSchema = z.object({
  paymentId: z.string().uuid('Invalid payment ID'),
  riskScore: z.number().min(0).max(1),
  riskFactors: z.array(z.object({
    factor: z.string(),
    weight: z.number().min(0).max(1),
    description: z.string(),
  })),
  recommendation: z.enum(['APPROVE', 'REVIEW', 'DECLINE']),
  confidence: z.number().min(0).max(1),
  timestamp: z.string().datetime(),
});

export const ComplianceAuditSchema = z.object({
  paymentId: z.string().uuid('Invalid payment ID'),
  action: z.enum(['CREATE', 'UPDATE', 'REFUND', 'CANCEL', 'VIEW']),
  userId: z.string().uuid('Invalid user ID'),
  tenantId: z.string().uuid('Invalid tenant ID'),
  ipAddress: z.string().ip('Invalid IP address'),
  userAgent: z.string().optional(),
  timestamp: z.string().datetime(),
  details: z.record(z.unknown()).optional(),
  complianceFlags: z.array(z.string()).optional(),
});

// Fraud Detection Service Interface
export interface FraudDetectionResult {
  riskScore: number;
  riskFactors: Array<{
    factor: string;
    weight: number;
    description: string;
  }>;
  recommendation: 'APPROVE' | 'REVIEW' | 'DECLINE';
  confidence: number;
  timestamp: Date;
}

// Compliance Audit Interface
export interface ComplianceAudit {
  paymentId: string;
  action: 'CREATE' | 'UPDATE' | 'REFUND' | 'CANCEL' | 'VIEW';
  userId: string;
  tenantId: string;
  ipAddress: string;
  userAgent?: string;
  timestamp: Date;
  details?: Record<string, unknown>;
  complianceFlags?: string[];
}

// Payment Metrics Interface
export interface PaymentMetrics {
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  fraudDetected: number;
  averageProcessingTime: number;
  successRate: number;
  fraudRate: number;
  topProviders: Array<{ provider: string; count: number; percentage: number }>;
  topMethods: Array<{ method: string; count: number; percentage: number }>;
  hourlyVolume: Array<{ hour: number; count: number; amount: number }>;
}

@Injectable()
export class EnterprisePaymentService {
  private readonly logger = new Logger(EnterprisePaymentService.name);
  private readonly fraudDetectionCache = new Map<string, FraudDetectionResult>();
  private readonly complianceAuditLog: ComplianceAudit[] = [];
  private readonly paymentMetrics: PaymentMetrics = {
    totalPayments: 0,
    successfulPayments: 0,
    failedPayments: 0,
    fraudDetected: 0,
    averageProcessingTime: 0,
    successRate: 0,
    fraudRate: 0,
    topProviders: [],
    topMethods: [],
    hourlyVolume: [],
  };

  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly paymentService: PaymentService,
    private readonly stripeService: StripeService,
    private readonly braintreeService: BraintreeService,
    private readonly paypalService: PayPalService,
    private readonly enterpriseValidationService: EnterpriseZodValidationService,
  ) {}

  /**
   * Create payment with enterprise-grade validation and fraud detection
   */
  async createEnterprisePayment(
    createPaymentDto: CreatePaymentDto,
    userId: string,
    tenantId: string,
    context: {
      ipAddress: string;
      userAgent?: string;
      requestId?: string;
    },
  ): Promise<PaymentResponseDto> {
    const startTime = Date.now();

    try {
      // Enterprise validation with Zod
      const validationResult = await this.enterpriseValidationService.validate(createPaymentDto, {
        schema: EnterprisePaymentSchema,
        transform: true,
        whitelist: true,
        audit: true,
        cache: true,
        metrics: true,
      });

      if (!validationResult.success) {
        throw new BadRequestException(`Validation failed: ${validationResult.errors?.message}`);
      }

      const validatedData = validationResult.data as EnterprisePaymentData;

      // Fraud detection
      const fraudResult = await this.performFraudDetection(validatedData, context);
      
      if (fraudResult.recommendation === 'DECLINE') {
        await this.logComplianceAudit({
          paymentId: 'pending',
          action: 'CREATE',
          userId,
          tenantId,
          ipAddress: context.ipAddress,
          ...(context.userAgent && { userAgent: context.userAgent }),
          timestamp: new Date(),
          details: { fraudResult, reason: 'Fraud detected' },
          complianceFlags: ['FRAUD_DETECTED', 'PAYMENT_DECLINED'],
        });

        throw new BadRequestException('Payment declined due to fraud risk');
      }

      if (fraudResult.recommendation === 'REVIEW') {
        this.logger.warn(`Payment requires manual review: ${JSON.stringify(fraudResult)}`);
        // In production, this would trigger a manual review workflow
      }

      // Create payment record with fraud detection data
      const payment = await this.paymentRepository.create({
        amount: validatedData.amount,
        currency: validatedData.currency,
        provider: validatedData.provider,
        method: validatedData.method,
        description: validatedData.description,
        customerEmail: validatedData.customerEmail,
        userId,
        tenantId,
        status: PaymentStatus.PENDING,
        metadata: {
          ...validatedData.metadata,
          fraudDetection: fraudResult,
          requestId: context.requestId,
        },
      });

      // Process payment with retry logic
      const processingResult = await this.processPaymentWithRetry(
        payment,
        validatedData.retryPolicy || { maxRetries: 3, retryDelay: 5000, exponentialBackoff: true }
      );

      // Update payment with processing result
      const updatedPayment = await this.paymentRepository.update(payment.id, {
        ...(processingResult.providerPaymentId && { providerPaymentId: processingResult.providerPaymentId }),
        ...(processingResult.paymentUrl && { paymentUrl: processingResult.paymentUrl }),
        status: processingResult.status,
        metadata: {
          ...payment.metadata,
          processingTime: Date.now() - startTime,
          retryCount: processingResult.retryCount,
        },
      });

      // Log compliance audit
      await this.logComplianceAudit({
        paymentId: payment.id,
        action: 'CREATE',
        userId,
        tenantId,
        ipAddress: context.ipAddress,
        ...(context.userAgent && { userAgent: context.userAgent }),
        timestamp: new Date(),
        details: { processingResult, fraudResult },
        complianceFlags: fraudResult.recommendation === 'REVIEW' ? ['MANUAL_REVIEW'] : [],
      });

      // Update metrics
      this.updatePaymentMetrics(updatedPayment, Date.now() - startTime);

      return this.mapToResponseDto(updatedPayment);

    } catch (error) {
      this.logger.error(`Enterprise payment creation failed: ${(error as Error).message}`, error.stack);
      
      // Log failed payment for compliance
      await this.logComplianceAudit({
        paymentId: 'failed',
        action: 'CREATE',
        userId,
        tenantId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        timestamp: new Date(),
        details: { error: (error as Error).message },
        complianceFlags: ['PAYMENT_FAILED'],
      });

      throw error;
    }
  }

  /**
   * Advanced fraud detection using multiple risk factors
   */
  private async performFraudDetection(
    paymentData: Record<string, unknown>,
    context: { ipAddress: string; userAgent?: string; requestId?: string }
  ): Promise<FraudDetectionResult> {
    const cacheKey = `${paymentData.customerEmail}-${context.ipAddress}`;
    
    // Check cache first
    if (this.fraudDetectionCache.has(cacheKey)) {
      return this.fraudDetectionCache.get(cacheKey)!;
    }

    const riskFactors: Array<{ factor: string; weight: number; description: string }> = [];
    let totalRiskScore = 0;

    // Amount-based risk assessment
    if ((paymentData.amount as number) > 10000) {
      riskFactors.push({
        factor: 'HIGH_AMOUNT',
        weight: 0.3,
        description: 'Payment amount exceeds $10,000',
      });
      totalRiskScore += 0.3;
    }

    // Velocity-based risk assessment
    const recentPayments = await this.getRecentPaymentsByEmail(paymentData.customerEmail as string, 24);
    if (recentPayments.length > 5) {
      riskFactors.push({
        factor: 'HIGH_VELOCITY',
        weight: 0.4,
        description: 'Multiple payments in last 24 hours',
      });
      totalRiskScore += 0.4;
    }

    // Geographic risk assessment
    const geoRisk = await this.assessGeographicRisk(context.ipAddress, paymentData.billingAddress?.country);
    if (geoRisk > 0.5) {
      riskFactors.push({
        factor: 'GEOGRAPHIC_RISK',
        weight: geoRisk,
        description: 'High-risk geographic location',
      });
      totalRiskScore += geoRisk;
    }

    // Device fingerprinting risk
    const deviceRisk = this.assessDeviceRisk(context.userAgent);
    if (deviceRisk > 0.3) {
      riskFactors.push({
        factor: 'DEVICE_RISK',
        weight: deviceRisk,
        description: 'Suspicious device characteristics',
      });
      totalRiskScore += deviceRisk;
    }

    // Email domain risk
    const emailRisk = this.assessEmailRisk(paymentData.customerEmail as string);
    if (emailRisk > 0.2) {
      riskFactors.push({
        factor: 'EMAIL_RISK',
        weight: emailRisk,
        description: 'High-risk email domain',
      });
      totalRiskScore += emailRisk;
    }

    // Determine recommendation
    let recommendation: 'APPROVE' | 'REVIEW' | 'DECLINE';
    if (totalRiskScore >= 0.8) {
      recommendation = 'DECLINE';
    } else if (totalRiskScore >= 0.5) {
      recommendation = 'REVIEW';
    } else {
      recommendation = 'APPROVE';
    }

    const fraudResult: FraudDetectionResult = {
      riskScore: Math.min(totalRiskScore, 1),
      riskFactors,
      recommendation,
      confidence: Math.max(0.7, 1 - totalRiskScore),
      timestamp: new Date(),
    };

    // Cache result for 1 hour
    this.fraudDetectionCache.set(cacheKey, fraudResult);
    setTimeout(() => this.fraudDetectionCache.delete(cacheKey), 60 * 60 * 1000);

    return fraudResult;
  }

  /**
   * Process payment with retry logic and exponential backoff
   */
  private async processPaymentWithRetry(
    payment: Payment,
    retryPolicy: { maxRetries: number; retryDelay: number; exponentialBackoff: boolean }
  ): Promise<{ providerPaymentId?: string; paymentUrl?: string; status: PaymentStatus; retryCount: number }> {
    let lastError: Error | null = null;
    let retryCount = 0;

    for (let attempt = 0; attempt <= retryPolicy.maxRetries; attempt++) {
      try {
        let providerResult;
        
        switch (payment.provider) {
          case PaymentProvider.STRIPE:
            providerResult = await this.stripeService.createPayment(payment);
            break;
          case PaymentProvider.BRAINTREE:
            providerResult = await this.braintreeService.createPayment(payment);
            break;
          case PaymentProvider.PAYPAL:
            providerResult = await this.paypalService.createPayment(payment);
            break;
          default:
            throw new BadRequestException('Unsupported payment provider');
        }

        return {
          ...providerResult,
          retryCount,
        };

      } catch (error) {
        lastError = error as Error;
        retryCount = attempt;

        if (attempt < retryPolicy.maxRetries) {
          const delay = retryPolicy.exponentialBackoff 
            ? retryPolicy.retryDelay * Math.pow(2, attempt)
            : retryPolicy.retryDelay;
          
          this.logger.warn(`Payment attempt ${attempt + 1} failed, retrying in ${delay}ms: ${(error as Error).message}`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    this.logger.error(`Payment processing failed after ${retryCount} retries: ${lastError?.message}`);
    return {
      status: PaymentStatus.FAILED,
      retryCount,
    };
  }

  /**
   * Get comprehensive payment metrics
   */
  async getPaymentMetrics(tenantId: string, timeRange: { start: Date; end: Date }): Promise<PaymentMetrics> {
    // This would typically query the database for real metrics
    // For now, return the in-memory metrics
    return { ...this.paymentMetrics };
  }

  /**
   * Get compliance audit log
   */
  async getComplianceAuditLog(
    tenantId: string,
    filters: {
      paymentId?: string;
      action?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<ComplianceAudit[]> {
    return this.complianceAuditLog.filter(audit => {
      if (audit.tenantId !== tenantId) return false;
      if (filters.paymentId && audit.paymentId !== filters.paymentId) return false;
      if (filters.action && audit.action !== filters.action) return false;
      if (filters.startDate && audit.timestamp < filters.startDate) return false;
      if (filters.endDate && audit.timestamp > filters.endDate) return false;
      return true;
    });
  }

  /**
   * Risk assessment helper methods
   */
  private async getRecentPaymentsByEmail(email: string, hours: number): Promise<Payment[]> {
    // This would typically query the database
    // For now, return empty array
    return [];
  }

  private async assessGeographicRisk(ipAddress: string, country?: string): Promise<number> {
    // Mock geographic risk assessment
    // In production, this would use a geolocation service
    const highRiskCountries = ['XX', 'YY', 'ZZ']; // Example high-risk country codes
    if (country && highRiskCountries.includes(country)) {
      return 0.7;
    }
    return 0.1;
  }

  private assessDeviceRisk(userAgent?: string): number {
    if (!userAgent) return 0.5;
    
    // Check for suspicious user agent patterns
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(userAgent)) {
        return 0.8;
      }
    }
    
    return 0.1;
  }

  private assessEmailRisk(email: string): number {
    const highRiskDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com'];
    const domain = email.split('@')[1];
    
    if (highRiskDomains.includes(domain)) {
      return 0.6;
    }
    
    return 0.1;
  }

  /**
   * Update payment metrics
   */
  private updatePaymentMetrics(payment: Payment, processingTime: number): void {
    this.paymentMetrics.totalPayments++;
    
    if (payment.status === PaymentStatus.COMPLETED) {
      this.paymentMetrics.successfulPayments++;
    } else if (payment.status === PaymentStatus.FAILED) {
      this.paymentMetrics.failedPayments++;
    }
    
    // Update fraud detection count
    if (payment.metadata?.fraudDetection?.recommendation === 'DECLINE') {
      this.paymentMetrics.fraudDetected++;
    }
    
    // Update average processing time
    const totalTime = this.paymentMetrics.averageProcessingTime * (this.paymentMetrics.totalPayments - 1) + processingTime;
    this.paymentMetrics.averageProcessingTime = totalTime / this.paymentMetrics.totalPayments;
    
    // Update success rate
    this.paymentMetrics.successRate = this.paymentMetrics.successfulPayments / this.paymentMetrics.totalPayments;
    
    // Update fraud rate
    this.paymentMetrics.fraudRate = this.paymentMetrics.fraudDetected / this.paymentMetrics.totalPayments;
  }

  /**
   * Log compliance audit
   */
  private async logComplianceAudit(audit: ComplianceAudit): Promise<void> {
    this.complianceAuditLog.push(audit);
    
    // In production, this would be stored in a secure audit database
    this.logger.log(`Compliance audit logged: ${audit.action} for payment ${audit.paymentId}`);
  }

  /**
   * Map payment entity to response DTO
   */
  private mapToResponseDto(payment: Payment): PaymentResponseDto {
    return {
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      provider: payment.provider,
      method: payment.method,
      description: payment.description,
      customerEmail: payment.customerEmail,
      metadata: payment.metadata,
      providerPaymentId: payment.providerPaymentId,
      paymentUrl: payment.paymentUrl,
      refundAmount: payment.refundAmount,
      refundReason: payment.refundReason,
      tenantId: payment.tenantId,
      userId: payment.userId,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }

  // Additional methods required by the controller
  async getPayments(
    userId: string,
    tenantId: string,
    filters: {
      page: number;
      limit: number;
      status?: string;
      provider?: string;
    },
  ): Promise<PaymentListResponseDto> {
    return await this.paymentService.getPayments(userId, tenantId, filters);
  }

  async getPayment(
    id: string,
    userId: string,
    tenantId: string,
  ): Promise<PaymentResponseDto> {
    return await this.paymentService.getPayment(id, userId, tenantId);
  }

  async updatePayment(
    id: string,
    updatePaymentDto: Record<string, unknown>,
    userId: string,
    tenantId: string,
  ): Promise<PaymentResponseDto> {
    return await this.paymentService.updatePayment(id, updatePaymentDto, userId, tenantId);
  }

  async cancelPayment(
    id: string,
    userId: string,
    tenantId: string,
  ): Promise<void> {
    return await this.paymentService.cancelPayment(id, userId, tenantId);
  }

  async refundPayment(
    id: string,
    refundData: { amount?: number; reason?: string },
    userId: string,
    tenantId: string,
  ): Promise<PaymentResponseDto> {
    return await this.paymentService.refundPayment(id, refundData, userId, tenantId);
  }
}

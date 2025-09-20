import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StripeService } from '../providers/stripe.service';
import { PayPalService } from '../providers/paypal.service';
import { SquareService } from '../providers/square.service';
import { AdyenService } from '../providers/adyen.service';
import { FraudDetectionService } from './fraud-detection.service';
import { ComplianceService } from './compliance.service';
import { WebhookService } from './webhook.service';
import { 
  PaymentRequest, 
  PaymentResult, 
  PaymentProvider, 
  RefundRequest, 
  RefundResult,
  WebhookEvent
} from '../interfaces/payment-options.interface';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly providers: Map<PaymentProvider, any> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly stripeService: StripeService,
    private readonly paypalService: PayPalService,
    private readonly squareService: SquareService,
    private readonly adyenService: AdyenService,
    private readonly fraudDetectionService: FraudDetectionService,
    private readonly complianceService: ComplianceService,
    private readonly webhookService: WebhookService
  ) {
    this.initializeProviders();
  }

  /**
   * Process a payment with intelligent provider selection
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Processing payment: ${request.amount} ${request.currency}`);

      // Validate payment request
      this.validatePaymentRequest(request);

      // Run fraud detection
      const fraudResult = await this.fraudDetectionService.analyzePayment(request);
      if (fraudResult.recommendedAction === 'block') {
        throw new Error(`Payment blocked by fraud detection: ${fraudResult.triggeredRules.join(', ')}`);
      }

      // Run compliance checks
      const complianceResult = await this.complianceService.validatePayment(request);

      // Select optimal provider
      const provider = this.selectOptimalProvider(request);

      // Process payment with selected provider
      const result = await this.processPaymentWithProvider(provider, request);

      // Add fraud and compliance results
      result.fraudResult = fraudResult;
      result.complianceResult = complianceResult;

      // Log payment result
      this.logger.log(`Payment processed successfully: ${result.id} via ${provider} in ${Date.now() - startTime}ms`);

      return result;

    } catch (error) {
      this.logger.error(`Payment processing failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Process refund
   */
  async processRefund(request: RefundRequest): Promise<RefundResult> {
    try {
      this.logger.log(`Processing refund for payment: ${request.paymentId}`);

      // Get original payment to determine provider
      const originalPayment = await this.getPaymentById(request.paymentId);
      if (!originalPayment) {
        throw new Error(`Payment not found: ${request.paymentId}`);
      }

      // Process refund with same provider
      const result = await this.processRefundWithProvider(
        originalPayment.provider,
        request,
        originalPayment
      );

      this.logger.log(`Refund processed successfully: ${result.id}`);
      return result;

    } catch (error) {
      this.logger.error(`Refund processing failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: string): Promise<PaymentResult | null> {
    // This would typically query a database
    // For now, return null as we don't have persistence layer
    return null;
  }

  /**
   * Handle webhook event
   */
  async handleWebhook(provider: PaymentProvider, payload: any, signature: string): Promise<void> {
    try {
      this.logger.log(`Handling webhook from ${provider}`);

      // Verify webhook signature
      const isValid = await this.verifyWebhookSignature(provider, payload, signature);
      if (!isValid) {
        throw new Error('Invalid webhook signature');
      }

      // Process webhook event
      const event: WebhookEvent = {
        id: payload.id || `webhook_${Date.now()}`,
        type: payload.type || 'unknown',
        provider,
        data: payload.data || payload,
        timestamp: new Date(),
        signature
      };

      await this.webhookService.processEvent(event);

    } catch (error) {
      this.logger.error(`Webhook handling failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(provider?: PaymentProvider): Promise<any> {
    // This would typically query a database for statistics
    return {
      totalPayments: 0,
      totalAmount: 0,
      successRate: 0,
      averageAmount: 0,
      provider: provider || 'all'
    };
  }

  /**
   * Initialize payment providers
   */
  private initializeProviders(): void {
    this.providers.set('stripe', this.stripeService);
    this.providers.set('paypal', this.paypalService);
    this.providers.set('square', this.squareService);
    this.providers.set('adyen', this.adyenService);
  }

  /**
   * Select optimal payment provider based on request characteristics
   */
  private selectOptimalProvider(request: PaymentRequest): PaymentProvider {
    const primary = this.configService.get<string>('PAYMENT_PRIMARY_PROVIDER', 'stripe');
    const fallbacks = this.configService.get<string[]>('PAYMENT_FALLBACK_PROVIDERS', []);

    // Provider selection logic based on payment characteristics
    if (request.paymentMethod.type === 'paypal') {
      return 'paypal';
    }

    if (request.paymentMethod.type === 'apple_pay' || request.paymentMethod.type === 'google_pay') {
      return 'stripe'; // Stripe has better mobile payment support
    }

    if (request.currency === 'USD' && request.amount < 10000) { // < $100
      return 'square'; // Square is good for small US transactions
    }

    if (request.complianceOptions?.threeDSecure || request.complianceOptions?.sca) {
      return 'adyen'; // Adyen has better 3DS/SCA support
    }

    // Check provider health
    const availableProviders = this.getAvailableProviders();
    if (availableProviders.includes(primary as PaymentProvider)) {
      return primary as PaymentProvider;
    }

    // Use first available fallback
    for (const fallback of fallbacks) {
      if (availableProviders.includes(fallback as PaymentProvider)) {
        return fallback as PaymentProvider;
      }
    }

    // Default to stripe
    return 'stripe';
  }

  /**
   * Get list of available providers
   */
  private getAvailableProviders(): PaymentProvider[] {
    const providers: PaymentProvider[] = [];
    
    if (this.stripeService.isHealthy()) {
      providers.push('stripe');
    }
    
    if (this.paypalService.isHealthy()) {
      providers.push('paypal');
    }
    
    if (this.squareService.isHealthy()) {
      providers.push('square');
    }
    
    if (this.adyenService.isHealthy()) {
      providers.push('adyen');
    }
    
    return providers;
  }

  /**
   * Process payment with specific provider
   */
  private async processPaymentWithProvider(
    provider: PaymentProvider,
    request: PaymentRequest
  ): Promise<PaymentResult> {
    const providerService = this.providers.get(provider);
    if (!providerService) {
      throw new Error(`Provider not available: ${provider}`);
    }

    return await providerService.processPayment(request);
  }

  /**
   * Process refund with specific provider
   */
  private async processRefundWithProvider(
    provider: PaymentProvider,
    request: RefundRequest,
    originalPayment: PaymentResult
  ): Promise<RefundResult> {
    const providerService = this.providers.get(provider);
    if (!providerService) {
      throw new Error(`Provider not available: ${provider}`);
    }

    return await providerService.processRefund(request, originalPayment);
  }

  /**
   * Verify webhook signature
   */
  private async verifyWebhookSignature(
    provider: PaymentProvider,
    payload: any,
    signature: string
  ): Promise<boolean> {
    const providerService = this.providers.get(provider);
    if (!providerService) {
      return false;
    }

    return await providerService.verifyWebhookSignature(payload, signature);
  }

  /**
   * Validate payment request
   */
  private validatePaymentRequest(request: PaymentRequest): void {
    if (!request.amount || request.amount <= 0) {
      throw new Error('Invalid payment amount');
    }

    if (!request.currency || request.currency.length !== 3) {
      throw new Error('Invalid currency code');
    }

    if (!request.paymentMethod) {
      throw new Error('Payment method is required');
    }

    if (!request.paymentMethod.type) {
      throw new Error('Payment method type is required');
    }

    if (!request.paymentMethod.details) {
      throw new Error('Payment method details are required');
    }
  }
}

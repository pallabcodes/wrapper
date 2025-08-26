/**
 * Multi-Payment Provider System
 * 
 * Production-grade payment provider management with:
 * - Multiple providers per transaction
 * - Fallback strategies
 * - Provider routing based on cost/performance
 * - Health monitoring and failover
 * - Advanced payment methods support
 */

import { EventEmitter } from 'events';
import { Result, AsyncResult } from '../../shared/functionalArchitecture.js';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export type PaymentProvider = 'stripe' | 'paypal' | 'square' | 'adyen' | 'braintree' | 'apple-pay' | 'google-pay';

export type PaymentMethod = 'card' | 'paypal' | 'bank_transfer' | 'apple_pay' | 'google_pay' | 'crypto';

export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'refunded';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'CHF';

export interface PaymentRequest {
  id: string;
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  description?: string;
  metadata?: Record<string, string>;
  customerId?: string;
  preferredProviders?: PaymentProvider[];
  fallbackStrategy?: 'cost' | 'performance' | 'reliability';
}

export interface PaymentResponse {
  id: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  transactionId: string;
  amount: number;
  currency: Currency;
  fees: number;
  processingTime: number;
  metadata?: Record<string, any>;
  error?: string;
}

export interface ProviderConfig {
  name: PaymentProvider;
  enabled: boolean;
  priority: number;
  costPercentage: number;
  successRate: number;
  averageProcessingTime: number;
  supportedMethods: PaymentMethod[];
  supportedCurrencies: Currency[];
  apiKey: string;
  secretKey: string;
  webhookSecret?: string;
  sandboxMode: boolean;
}

export interface ProviderHealth {
  provider: PaymentProvider;
  isHealthy: boolean;
  lastCheck: Date;
  responseTime: number;
  errorRate: number;
  uptime: number;
  lastError?: string;
}

export interface RoutingStrategy {
  name: string;
  description: string;
  selectProvider: (request: PaymentRequest, providers: ProviderConfig[]) => PaymentProvider;
}

// ============================================================================
// PAYMENT PROVIDER INTERFACE
// ============================================================================

export interface IPaymentProvider {
  name: PaymentProvider;
  config: ProviderConfig;
  
  initialize(): Promise<void>;
  processPayment(request: PaymentRequest): Promise<AsyncResult<PaymentResponse>>;
  refundPayment(transactionId: string, amount?: number): Promise<AsyncResult<PaymentResponse>>;
  getHealth(): Promise<ProviderHealth>;
  isSupported(request: PaymentRequest): boolean;
}

// ============================================================================
// MULTI-PAYMENT PROVIDER MANAGER
// ============================================================================

export class MultiPaymentProviderManager extends EventEmitter {
  private providers: Map<PaymentProvider, IPaymentProvider> = new Map();
  private healthMonitor: Map<PaymentProvider, ProviderHealth> = new Map();
  private routingStrategies: Map<string, RoutingStrategy> = new Map();
  private metrics = {
    totalTransactions: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    averageProcessingTime: 0,
    totalFees: 0
  };

  constructor() {
    super();
    this.initializeRoutingStrategies();
    this.startHealthMonitoring();
  }

  // ============================================================================
  // PROVIDER MANAGEMENT
  // ============================================================================

  registerProvider(provider: IPaymentProvider): void {
    this.providers.set(provider.name, provider);
    this.healthMonitor.set(provider.name, {
      provider: provider.name,
      isHealthy: true,
      lastCheck: new Date(),
      responseTime: 0,
      errorRate: 0,
      uptime: 100
    });

    console.log(`✅ Registered payment provider: ${provider.name}`);
  }

  async initializeProviders(): Promise<void> {
    const initPromises = Array.from(this.providers.values()).map(async (provider) => {
      try {
        await provider.initialize();
        console.log(`🚀 Initialized payment provider: ${provider.name}`);
      } catch (error) {
        console.error(`❌ Failed to initialize ${provider.name}:`, error);
        this.markProviderUnhealthy(provider.name, error as Error);
      }
    });

    await Promise.allSettled(initPromises);
  }

  // ============================================================================
  // PAYMENT PROCESSING
  // ============================================================================

  async processPayment(request: PaymentRequest): Promise<AsyncResult<PaymentResponse>> {
    const startTime = Date.now();
    
    try {
      // Select provider based on routing strategy
      const provider = this.selectProvider(request);
      if (!provider) {
        return Result.error('No suitable payment provider available');
      }

      // Process payment with selected provider
      const result = await provider.processPayment(request);
      
      if (Result.isSuccess(result)) {
        const response = Result.getValue(result);
        this.updateMetrics(response, Date.now() - startTime);
        this.emit('payment-success', { request, response, provider: provider.name });
        return result;
      } else {
        // Try fallback providers
        return await this.processWithFallback(request, provider.name);
      }
    } catch (error) {
      this.metrics.failedTransactions++;
      this.emit('payment-error', { request, error });
      return Result.error(`Payment processing failed: ${error}`);
    }
  }

  private async processWithFallback(
    request: PaymentRequest, 
    failedProvider: PaymentProvider
  ): Promise<AsyncResult<PaymentResponse>> {
    const availableProviders = this.getAvailableProviders(request)
      .filter(p => p.name !== failedProvider);

    for (const provider of availableProviders) {
      try {
        const result = await provider.processPayment(request);
        if (Result.isSuccess(result)) {
          console.log(`✅ Payment succeeded with fallback provider: ${provider.name}`);
          return result;
        }
      } catch (error) {
        console.warn(`⚠️ Fallback provider ${provider.name} failed:`, error);
        continue;
      }
    }

    return Result.error('All payment providers failed');
  }

  // ============================================================================
  // PROVIDER SELECTION AND ROUTING
  // ============================================================================

  private selectProvider(request: PaymentRequest): IPaymentProvider | null {
    const availableProviders = this.getAvailableProviders(request);
    
    if (availableProviders.length === 0) {
      return null;
    }

    // Use preferred providers if specified
    if (request.preferredProviders) {
      const preferred = availableProviders.find(p => 
        request.preferredProviders!.includes(p.name)
      );
      if (preferred) return preferred;
    }

    // Use routing strategy
    const strategy = this.routingStrategies.get(request.fallbackStrategy || 'cost');
    if (strategy) {
      const selectedProvider = strategy.selectProvider(request, availableProviders.map(p => p.config));
      return this.providers.get(selectedProvider) || null;
    }

    // Default to first available provider
    return availableProviders[0] || null;
  }

  private getAvailableProviders(request: PaymentRequest): IPaymentProvider[] {
    return Array.from(this.providers.values())
      .filter(provider => {
        const health = this.healthMonitor.get(provider.name);
        return provider.isSupported(request) && 
               health?.isHealthy && 
               provider.config.enabled;
      })
      .sort((a, b) => a.config.priority - b.config.priority);
  }

  // ============================================================================
  // ROUTING STRATEGIES
  // ============================================================================

  private initializeRoutingStrategies(): void {
    // Cost-based routing
    this.routingStrategies.set('cost', {
      name: 'Cost Optimization',
      description: 'Select provider with lowest fees',
      selectProvider: (request, providers) => {
        return providers
          .filter(p => p.enabled)
          .sort((a, b) => a.costPercentage - b.costPercentage)[0]?.name || 'stripe';
      }
    });

    // Performance-based routing
    this.routingStrategies.set('performance', {
      name: 'Performance Optimization',
      description: 'Select provider with fastest processing time',
      selectProvider: (request, providers) => {
        return providers
          .filter(p => p.enabled)
          .sort((a, b) => a.averageProcessingTime - b.averageProcessingTime)[0]?.name || 'stripe';
      }
    });

    // Reliability-based routing
    this.routingStrategies.set('reliability', {
      name: 'Reliability Optimization',
      description: 'Select provider with highest success rate',
      selectProvider: (request, providers) => {
        return providers
          .filter(p => p.enabled)
          .sort((a, b) => b.successRate - a.successRate)[0]?.name || 'stripe';
      }
    });
  }

  // ============================================================================
  // HEALTH MONITORING
  // ============================================================================

  private startHealthMonitoring(): void {
    setInterval(async () => {
      await this.checkAllProvidersHealth();
    }, 30000); // Check every 30 seconds
  }

  private async checkAllProvidersHealth(): Promise<void> {
    const healthPromises = Array.from(this.providers.values()).map(async (provider) => {
      try {
        const health = await provider.getHealth();
        this.healthMonitor.set(provider.name, health);
        
        if (!health.isHealthy) {
          this.emit('provider-unhealthy', { provider: provider.name, health });
        }
      } catch (error) {
        this.markProviderUnhealthy(provider.name, error as Error);
      }
    });

    await Promise.allSettled(healthPromises);
  }

  private markProviderUnhealthy(providerName: PaymentProvider, error: Error): void {
    const health = this.healthMonitor.get(providerName);
    if (health) {
      health.isHealthy = false;
      health.lastError = error.message;
      health.errorRate += 1;
      this.healthMonitor.set(providerName, health);
    }
  }

  // ============================================================================
  // METRICS AND MONITORING
  // ============================================================================

  private updateMetrics(response: PaymentResponse, processingTime: number): void {
    this.metrics.totalTransactions++;
    
    if (response.status === 'succeeded') {
      this.metrics.successfulTransactions++;
    } else {
      this.metrics.failedTransactions++;
    }

    this.metrics.totalFees += response.fees;
    this.metrics.averageProcessingTime = 
      (this.metrics.averageProcessingTime + processingTime) / 2;
  }

  getMetrics() {
    return { ...this.metrics };
  }

  getProviderHealth(): ProviderHealth[] {
    return Array.from(this.healthMonitor.values());
  }

  getHealthyProviders(): PaymentProvider[] {
    return Array.from(this.healthMonitor.entries())
      .filter(([_, health]) => health.isHealthy)
      .map(([provider]) => provider);
  }
}

// ============================================================================
// PROVIDER IMPLEMENTATIONS
// ============================================================================

export class StripeProvider implements IPaymentProvider {
  name: PaymentProvider = 'stripe';
  config: ProviderConfig;

  constructor(config: Partial<ProviderConfig>) {
    this.config = {
      name: 'stripe',
      enabled: true,
      priority: 1,
      costPercentage: 2.9,
      successRate: 99.5,
      averageProcessingTime: 2000,
      supportedMethods: ['card', 'apple_pay', 'google_pay'],
      supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
      apiKey: config.apiKey || '',
      secretKey: config.secretKey || '',
      sandboxMode: config.sandboxMode || true,
      ...config
    };
  }

  async initialize(): Promise<void> {
    // Initialize Stripe SDK
    console.log('Initializing Stripe provider...');
  }

  async processPayment(request: PaymentRequest): Promise<AsyncResult<PaymentResponse>> {
    try {
      // Simulate Stripe payment processing
      await new Promise(resolve => setTimeout(resolve, this.config.averageProcessingTime));
      
      const response: PaymentResponse = {
        id: request.id,
        provider: this.name,
        status: 'succeeded',
        transactionId: `stripe_${Date.now()}`,
        amount: request.amount,
        currency: request.currency,
        fees: request.amount * (this.config.costPercentage / 100),
        processingTime: this.config.averageProcessingTime,
        metadata: { provider: 'stripe' }
      };

      return Result.success(response);
    } catch (error) {
      return Result.error(`Stripe payment failed: ${error}`);
    }
  }

  async refundPayment(transactionId: string, amount?: number): Promise<AsyncResult<PaymentResponse>> {
    // Implement refund logic
    return Result.error('Refund not implemented');
  }

  async getHealth(): Promise<ProviderHealth> {
    return {
      provider: this.name,
      isHealthy: true,
      lastCheck: new Date(),
      responseTime: this.config.averageProcessingTime,
      errorRate: 0.5,
      uptime: 99.5
    };
  }

  isSupported(request: PaymentRequest): boolean {
    return this.config.supportedMethods.includes(request.paymentMethod) &&
           this.config.supportedCurrencies.includes(request.currency);
  }
}

export class PayPalProvider implements IPaymentProvider {
  name: PaymentProvider = 'paypal';
  config: ProviderConfig;

  constructor(config: Partial<ProviderConfig>) {
    this.config = {
      name: 'paypal',
      enabled: true,
      priority: 2,
      costPercentage: 3.5,
      successRate: 98.8,
      averageProcessingTime: 3500,
      supportedMethods: ['paypal', 'card'],
      supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
      apiKey: config.apiKey || '',
      secretKey: config.secretKey || '',
      sandboxMode: config.sandboxMode || true,
      ...config
    };
  }

  async initialize(): Promise<void> {
    console.log('Initializing PayPal provider...');
  }

  async processPayment(request: PaymentRequest): Promise<AsyncResult<PaymentResponse>> {
    try {
      await new Promise(resolve => setTimeout(resolve, this.config.averageProcessingTime));
      
      const response: PaymentResponse = {
        id: request.id,
        provider: this.name,
        status: 'succeeded',
        transactionId: `paypal_${Date.now()}`,
        amount: request.amount,
        currency: request.currency,
        fees: request.amount * (this.config.costPercentage / 100),
        processingTime: this.config.averageProcessingTime,
        metadata: { provider: 'paypal' }
      };

      return Result.success(response);
    } catch (error) {
      return Result.error(`PayPal payment failed: ${error}`);
    }
  }

  async refundPayment(transactionId: string, amount?: number): Promise<AsyncResult<PaymentResponse>> {
    return Result.error('Refund not implemented');
  }

  async getHealth(): Promise<ProviderHealth> {
    return {
      provider: this.name,
      isHealthy: true,
      lastCheck: new Date(),
      responseTime: this.config.averageProcessingTime,
      errorRate: 1.2,
      uptime: 98.8
    };
  }

  isSupported(request: PaymentRequest): boolean {
    return this.config.supportedMethods.includes(request.paymentMethod) &&
           this.config.supportedCurrencies.includes(request.currency);
  }
}

// Export singleton instance
export const multiPaymentManager = new MultiPaymentProviderManager();

import { Injectable, Logger } from '@nestjs/common';
import { 
  PaymentService, 
  UseProvider, 
  EnableFraudDetection, 
  Enable3DSecure,
  EnableSCA,
  EnableDataRetention,
  LogPayment,
  PaymentTimeout,
  EnableRetry
} from '@ecommerce-enterprise/nest-payments';
import { PaymentRequest, RefundRequest } from '@ecommerce-enterprise/nest-payments';

@Injectable()
export class PaymentsDemoService {
  private readonly logger = new Logger(PaymentsDemoService.name);

  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Demo 1: Basic payment processing with automatic provider selection
   */
  async processBasicPayment() {
    this.logger.log('Demo 1: Basic payment processing');

    const request: PaymentRequest = {
      amount: 5000, // $50.00
      currency: 'USD',
      paymentMethod: {
        type: 'card',
        details: {
          number: '4242424242424242',
          expiryMonth: 12,
          expiryYear: 2025,
          cvv: '123',
          holderName: 'John Doe'
        },
        billingAddress: {
          line1: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US'
        }
      },
      customer: {
        email: 'john@example.com',
        name: 'John Doe',
        phone: '+1234567890'
      },
      order: {
        id: 'order_123',
        description: 'Demo payment for ecommerce platform',
        items: [
          {
            id: 'item_1',
            name: 'Premium Subscription',
            description: 'Monthly premium subscription',
            quantity: 1,
            unitPrice: 5000,
            totalPrice: 5000
          }
        ]
      },
      metadata: {
        source: 'demo',
        campaign: 'enterprise_integration'
      }
    };

    const result = await this.paymentService.processPayment(request);
    this.logger.log(`Payment processed: ${result.id} via ${result.provider}`);
    
    return result;
  }

  /**
   * Demo 2: Stripe payment with fraud detection and 3D Secure
   */
  @UseProvider('stripe')
  @EnableFraudDetection()
  @Enable3DSecure()
  @LogPayment('info')
  @PaymentTimeout(30000)
  async processStripePayment() {
    this.logger.log('Demo 2: Stripe payment with enhanced security');

    const request: PaymentRequest = {
      amount: 10000, // $100.00
      currency: 'USD',
      paymentMethod: {
        type: 'card',
        details: {
          number: '4000000000000002', // Test card that requires 3DS
          expiryMonth: 12,
          expiryYear: 2025,
          cvv: '123',
          holderName: 'Jane Smith'
        }
      },
      customer: {
        email: 'jane@example.com',
        name: 'Jane Smith'
      },
      complianceOptions: {
        threeDSecure: true,
        sca: true
      },
      fraudOptions: {
        enabled: true,
        riskThreshold: 30
      }
    };

    const result = await this.paymentService.processPayment(request);
    this.logger.log(`Stripe payment processed: ${result.id}`);
    
    return result;
  }

  /**
   * Demo 3: PayPal payment
   */
  @UseProvider('paypal')
  @EnableFraudDetection()
  async processPayPalPayment() {
    this.logger.log('Demo 3: PayPal payment');

    const request: PaymentRequest = {
      amount: 2500, // $25.00
      currency: 'USD',
      paymentMethod: {
        type: 'paypal',
        details: {
          email: 'buyer@example.com'
        }
      },
      customer: {
        email: 'buyer@example.com',
        name: 'PayPal Buyer'
      },
      order: {
        id: 'paypal_order_123',
        description: 'PayPal demo payment'
      }
    };

    const result = await this.paymentService.processPayment(request);
    this.logger.log(`PayPal payment processed: ${result.id}`);
    
    return result;
  }

  /**
   * Demo 4: Square payment for small business
   */
  @UseProvider('square')
  @EnableFraudDetection()
  async processSquarePayment() {
    this.logger.log('Demo 4: Square payment for small business');

    const request: PaymentRequest = {
      amount: 1500, // $15.00
      currency: 'USD',
      paymentMethod: {
        type: 'card',
        details: {
          number: '4111111111111111',
          expiryMonth: 12,
          expiryYear: 2025,
          cvv: '123',
          holderName: 'Small Business Owner'
        }
      },
      customer: {
        email: 'owner@smallbiz.com',
        name: 'Small Business Owner'
      },
      order: {
        id: 'square_order_123',
        description: 'Coffee and pastry'
      }
    };

    const result = await this.paymentService.processPayment(request);
    this.logger.log(`Square payment processed: ${result.id}`);
    
    return result;
  }

  /**
   * Demo 5: Adyen payment with SCA compliance
   */
  @UseProvider('adyen')
  @EnableSCA()
  @EnableDataRetention(730) // 2 years
  async processAdyenPayment() {
    this.logger.log('Demo 5: Adyen payment with SCA compliance');

    const request: PaymentRequest = {
      amount: 7500, // $75.00
      currency: 'EUR',
      paymentMethod: {
        type: 'card',
        details: {
          number: '4111111111111111',
          expiryMonth: 12,
          expiryYear: 2025,
          cvv: '123',
          holderName: 'European Customer'
        },
        billingAddress: {
          line1: '123 European St',
          city: 'Amsterdam',
          postalCode: '1012 AB',
          country: 'NL'
        }
      },
      customer: {
        email: 'european@example.com',
        name: 'European Customer',
        address: {
          line1: '123 European St',
          city: 'Amsterdam',
          postalCode: '1012 AB',
          country: 'NL'
        }
      },
      complianceOptions: {
        sca: true,
        threeDSecure: true
      }
    };

    const result = await this.paymentService.processPayment(request);
    this.logger.log(`Adyen payment processed: ${result.id}`);
    
    return result;
  }

  /**
   * Demo 6: High-risk payment (should trigger fraud detection)
   */
  @EnableFraudDetection()
  async processHighRiskPayment() {
    this.logger.log('Demo 6: High-risk payment (fraud detection)');

    const request: PaymentRequest = {
      amount: 50000, // $500.00 - high amount
      currency: 'USD',
      paymentMethod: {
        type: 'card',
        details: {
          number: '4444444444444444', // Suspicious pattern
          expiryMonth: 12,
          expiryYear: 2025,
          cvv: '123',
          holderName: 'Suspicious User'
        }
      },
      customer: {
        email: 'suspicious@temp-mail.org', // Suspicious email domain
        name: 'Suspicious User'
      },
      metadata: {
        rapid_transaction: 'true', // Rapid transaction flag
        weekend: 'true' // Weekend transaction
      },
      fraudOptions: {
        enabled: true,
        riskThreshold: 20
      }
    };

    try {
      const result = await this.paymentService.processPayment(request);
      this.logger.log(`High-risk payment processed: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.log(`High-risk payment blocked: ${error.message}`);
      return { error: error.message, blocked: true };
    }
  }

  /**
   * Demo 7: Refund processing
   */
  async processRefund(paymentId: string, amount?: number) {
    this.logger.log(`Demo 7: Processing refund for payment ${paymentId}`);

    const request: RefundRequest = {
      paymentId,
      amount,
      reason: 'Customer request - demo refund',
      metadata: {
        refund_reason: 'demo',
        processed_by: 'system'
      }
    };

    const result = await this.paymentService.processRefund(request);
    this.logger.log(`Refund processed: ${result.id}`);
    
    return result;
  }

  /**
   * Demo 8: Webhook handling
   */
  async handleWebhookDemo(provider: string, payload: any, signature: string) {
    this.logger.log(`Demo 8: Handling webhook from ${provider}`);

    try {
      await this.paymentService.handleWebhook(provider as any, payload, signature);
      this.logger.log(`Webhook processed successfully from ${provider}`);
      return { success: true, provider };
    } catch (error) {
      this.logger.error(`Webhook processing failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Demo 9: Payment statistics
   */
  async getPaymentStats() {
    this.logger.log('Demo 9: Getting payment statistics');

    const stats = await this.paymentService.getPaymentStats();
    this.logger.log('Payment statistics retrieved');
    
    return {
      ...stats,
      demo: true,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Demo 10: Multi-currency payment
   */
  async processMultiCurrencyPayment() {
    this.logger.log('Demo 10: Multi-currency payment processing');

    const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD'];
    const results = [];

    for (const currency of currencies) {
      const request: PaymentRequest = {
        amount: 10000, // Amount varies by currency
        currency,
        paymentMethod: {
          type: 'card',
          details: {
            number: '4242424242424242',
            expiryMonth: 12,
            expiryYear: 2025,
            cvv: '123',
            holderName: 'Multi-Currency User'
          }
        },
        customer: {
          email: 'multicurrency@example.com',
          name: 'Multi-Currency User'
        },
        metadata: {
          currency_test: 'true',
          original_currency: currency
        }
      };

      try {
        const result = await this.paymentService.processPayment(request);
        results.push({ currency, success: true, paymentId: result.id, provider: result.provider });
      } catch (error) {
        results.push({ currency, success: false, error: error.message });
      }
    }

    this.logger.log(`Multi-currency processing complete: ${results.filter(r => r.success).length}/${results.length} successful`);
    return results;
  }

  /**
   * Demo 11: Apple Pay / Google Pay
   */
  async processMobilePayment() {
    this.logger.log('Demo 11: Mobile payment (Apple Pay / Google Pay)');

    const request: PaymentRequest = {
      amount: 3000, // $30.00
      currency: 'USD',
      paymentMethod: {
        type: 'apple_pay',
        details: {} // Apple Pay details would be provided by the client
      },
      customer: {
        email: 'mobile@example.com',
        name: 'Mobile User'
      },
      order: {
        id: 'mobile_order_123',
        description: 'Mobile payment demo'
      }
    };

    const result = await this.paymentService.processPayment(request);
    this.logger.log(`Mobile payment processed: ${result.id}`);
    
    return result;
  }

  /**
   * Demo 12: Subscription payment
   */
  async processSubscriptionPayment() {
    this.logger.log('Demo 12: Subscription payment');

    const request: PaymentRequest = {
      amount: 2999, // $29.99
      currency: 'USD',
      paymentMethod: {
        type: 'card',
        details: {
          number: '4242424242424242',
          expiryMonth: 12,
          expiryYear: 2025,
          cvv: '123',
          holderName: 'Subscription User'
        }
      },
      customer: {
        email: 'subscriber@example.com',
        name: 'Subscription User'
      },
      order: {
        id: 'subscription_123',
        description: 'Monthly subscription payment'
      },
      metadata: {
        subscription: 'true',
        billing_cycle: 'monthly',
        plan: 'premium'
      }
    };

    const result = await this.paymentService.processPayment(request);
    this.logger.log(`Subscription payment processed: ${result.id}`);
    
    return result;
  }
}

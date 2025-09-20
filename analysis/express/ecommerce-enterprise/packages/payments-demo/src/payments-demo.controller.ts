import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { PaymentsDemoService } from './payments-demo.service';

@Controller('payments-demo')
export class PaymentsDemoController {
  constructor(private readonly paymentsDemoService: PaymentsDemoService) {}

  @Get('basic')
  async processBasicPayment() {
    return await this.paymentsDemoService.processBasicPayment();
  }

  @Get('stripe')
  async processStripePayment() {
    return await this.paymentsDemoService.processStripePayment();
  }

  @Get('paypal')
  async processPayPalPayment() {
    return await this.paymentsDemoService.processPayPalPayment();
  }

  @Get('square')
  async processSquarePayment() {
    return await this.paymentsDemoService.processSquarePayment();
  }

  @Get('adyen')
  async processAdyenPayment() {
    return await this.paymentsDemoService.processAdyenPayment();
  }

  @Get('high-risk')
  async processHighRiskPayment() {
    return await this.paymentsDemoService.processHighRiskPayment();
  }

  @Post('refund/:paymentId')
  async processRefund(
    @Param('paymentId') paymentId: string,
    @Query('amount') amount?: string
  ) {
    const refundAmount = amount ? parseInt(amount) : undefined;
    return await this.paymentsDemoService.processRefund(paymentId, refundAmount);
  }

  @Post('webhook/:provider')
  async handleWebhook(
    @Param('provider') provider: string,
    @Body() payload: any,
    @Query('signature') signature: string
  ) {
    return await this.paymentsDemoService.handleWebhookDemo(provider, payload, signature);
  }

  @Get('stats')
  async getPaymentStats() {
    return await this.paymentsDemoService.getPaymentStats();
  }

  @Get('multi-currency')
  async processMultiCurrencyPayment() {
    return await this.paymentsDemoService.processMultiCurrencyPayment();
  }

  @Get('mobile')
  async processMobilePayment() {
    return await this.paymentsDemoService.processMobilePayment();
  }

  @Get('subscription')
  async processSubscriptionPayment() {
    return await this.paymentsDemoService.processSubscriptionPayment();
  }

  @Get('health')
  async healthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'payments-demo',
      features: [
        'Multi-Provider Support (Stripe, PayPal, Square, Adyen)',
        'Fraud Detection',
        'Compliance (3D Secure, SCA, PCI-DSS)',
        'Webhook Management',
        'Refund Processing',
        'Multi-Currency Support',
        'Mobile Payments',
        'Subscription Payments'
      ],
      endpoints: [
        'GET /payments-demo/basic - Basic payment processing',
        'GET /payments-demo/stripe - Stripe payment with 3DS',
        'GET /payments-demo/paypal - PayPal payment',
        'GET /payments-demo/square - Square payment',
        'GET /payments-demo/adyen - Adyen payment with SCA',
        'GET /payments-demo/high-risk - High-risk payment (fraud detection)',
        'POST /payments-demo/refund/:paymentId - Process refund',
        'POST /payments-demo/webhook/:provider - Handle webhooks',
        'GET /payments-demo/stats - Payment statistics',
        'GET /payments-demo/multi-currency - Multi-currency payments',
        'GET /payments-demo/mobile - Mobile payments',
        'GET /payments-demo/subscription - Subscription payments'
      ]
    };
  }
}

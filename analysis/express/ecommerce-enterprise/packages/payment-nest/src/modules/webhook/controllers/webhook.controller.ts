import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WebhookService } from '../services/webhook.service';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Stripe webhooks' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  async handleStripeWebhook(
    @Body() payload: any,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean }> {
    try {
      await this.webhookService.handleStripeWebhook(payload, signature);
      return { received: true };
    } catch (error) {
      throw new BadRequestException(`Stripe webhook processing failed: ${error.message}`);
    }
  }

  @Post('braintree')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Braintree webhooks' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  async handleBraintreeWebhook(
    @Body() payload: any,
    @Headers('bt-signature') signature: string,
  ): Promise<{ received: boolean }> {
    try {
      await this.webhookService.handleBraintreeWebhook(payload, signature);
      return { received: true };
    } catch (error) {
      throw new BadRequestException(`Braintree webhook processing failed: ${error.message}`);
    }
  }

  @Post('paypal')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle PayPal webhooks' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook data' })
  async handlePayPalWebhook(
    @Body() payload: any,
  ): Promise<{ received: boolean }> {
    try {
      await this.webhookService.handlePayPalWebhook(payload);
      return { received: true };
    } catch (error) {
      throw new BadRequestException(`PayPal webhook processing failed: ${error.message}`);
    }
  }
}

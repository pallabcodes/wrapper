import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PaymentResponseMapper } from './mappers/payment-response.mapper';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly responseMapper: PaymentResponseMapper,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a payment intent' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payment data' })
  async createPayment(
    @CurrentUser() user: { id: number },
    @Body() body: { amount: number; currency?: string },
  ) {
    const result = await this.paymentService.createPayment(
      user.id,
      body.amount,
      body.currency || 'USD',
    );
    return this.responseMapper.toCreateResponse(result);
  }

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle payment webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleWebhook(
    @Body() payload: unknown,
    @Headers('stripe-signature') signature: string,
  ) {
    const result = await this.paymentService.handleWebhook(payload, signature);
    return this.responseMapper.toWebhookResponse(result);
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment history' })
  @ApiResponse({ status: 200, description: 'Payment history retrieved successfully' })
  async getPaymentHistory(@CurrentUser() user: { id: number }) {
    const result = await this.paymentService.getPaymentHistory(user.id);
    return this.responseMapper.toReadResponse(result);
  }
}


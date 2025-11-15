import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { PaymentService } from '@application/services/payment.service';
import { PaymentStatus } from '@domain/entities/payment.entity';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  async createPayment(@Body() body: { userId: string; amount: number; currency?: string }) {
    const payment = await this.paymentService.createPayment(
      body.userId,
      body.amount,
      body.currency || 'USD',
    );
    return {
      success: true,
      data: payment,
    };
  }

  @Get(':id')
  async getPayment(@Param('id') id: string) {
    const payment = await this.paymentService.getPaymentById(id);
    return {
      success: true,
      data: payment,
    };
  }

  @Get('user/:userId')
  async getPaymentsByUser(@Param('userId') userId: string) {
    const payments = await this.paymentService.getPaymentsByUserId(userId);
    return {
      success: true,
      data: payments,
    };
  }

  @Post(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: PaymentStatus }) {
    const payment = await this.paymentService.updatePaymentStatus(id, body.status);
    return {
      success: true,
      data: payment,
    };
  }
}


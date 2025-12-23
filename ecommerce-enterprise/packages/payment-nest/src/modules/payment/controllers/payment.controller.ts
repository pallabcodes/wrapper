import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthXModule, RequirePermissions, RelationCheck, Require } from '@ecommerce-enterprise/authx';
import { PaymentService } from '../services/payment.service';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { UpdatePaymentDto } from '../dto/update-payment.dto';
import { PaymentResponseDto } from '../dto/payment-response.dto';
import { PaymentListResponseDto } from '../dto/payment-list-response.dto';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

const Context = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request[data];
  },
);

@ApiTags('payments')
@Controller('payments')
@ApiBearerAuth()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiResponse({ status: 201, description: 'Payment created successfully', type: PaymentResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid payment data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @RequirePermissions('payments:create')
  @Require((ctx) => ctx.principal.tenantId === ctx.req.body.tenantId)
  async createPayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @Context('userId') userId: string,
    @Context('tenantId') tenantId: string,
  ): Promise<PaymentResponseDto> {
    return this.paymentService.createPayment(createPaymentDto, userId, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all payments for the current user' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully', type: PaymentListResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by payment status' })
  @ApiQuery({ name: 'provider', required: false, type: String, description: 'Filter by payment provider' })
  @RequirePermissions('payments:read')
  async getPayments(
    @Context('userId') userId: string,
    @Context('tenantId') tenantId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('provider') provider?: string,
  ): Promise<PaymentListResponseDto> {
    return this.paymentService.getPayments(userId, tenantId, {
      page,
      limit,
      ...(status && { status }),
      ...(provider && { provider }),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific payment by ID' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully', type: PaymentResponseDto })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @RequirePermissions('payments:read')
  async getPayment(
    @Param('id') id: string,
    @Context('userId') userId: string,
    @Context('tenantId') tenantId: string,
  ): Promise<PaymentResponseDto> {
    return this.paymentService.getPayment(id, userId, tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a payment' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Payment updated successfully', type: PaymentResponseDto })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 400, description: 'Invalid payment data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @RequirePermissions('payments:update')
  async updatePayment(
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
    @Context('userId') userId: string,
    @Context('tenantId') tenantId: string,
  ): Promise<PaymentResponseDto> {
    return this.paymentService.updatePayment(id, updatePaymentDto, userId, tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel a payment' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 204, description: 'Payment cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 400, description: 'Payment cannot be cancelled' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @RequirePermissions('payments:delete')
  async cancelPayment(
    @Param('id') id: string,
    @Context('userId') userId: string,
    @Context('tenantId') tenantId: string,
  ): Promise<void> {
    return this.paymentService.cancelPayment(id, userId, tenantId);
  }

  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process a refund for a payment' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Refund processed successfully', type: PaymentResponseDto })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 400, description: 'Refund cannot be processed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @RequirePermissions('payments:refund')
  async refundPayment(
    @Param('id') id: string,
    @Body() refundData: { amount?: number; reason?: string },
    @Context('userId') userId: string,
    @Context('tenantId') tenantId: string,
  ): Promise<PaymentResponseDto> {
    return this.paymentService.refundPayment(id, refundData, userId, tenantId);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get payment status' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Payment status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @RequirePermissions('payments:read')
  async getPaymentStatus(
    @Param('id') id: string,
    @Context('userId') userId: string,
    @Context('tenantId') tenantId: string,
  ): Promise<{ status: string; lastUpdated: Date }> {
    return this.paymentService.getPaymentStatus(id, userId, tenantId);
  }
}

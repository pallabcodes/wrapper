import { Controller, Post, Body, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SharedValidationService } from '../validation/shared-validation.service';

@ApiTags('Shared Validation')
@Controller('shared/validate')
export class SharedValidationController {
  constructor(
    private readonly validationService: SharedValidationService,
  ) {}

  @Post('user')
  @ApiOperation({ summary: 'Validate user data' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User data is valid' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'User data is invalid' })
  async validateUser(@Body() data: unknown) {
    return await this.validationService.validateUser(data, {
      audit: true,
      metrics: true,
      cache: true,
    });
  }

  @Post('product')
  @ApiOperation({ summary: 'Validate product data' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Product data is valid' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Product data is invalid' })
  async validateProduct(@Body() data: unknown) {
    return await this.validationService.validateProduct(data, {
      audit: true,
      metrics: true,
      cache: true,
    });
  }

  @Post('order')
  @ApiOperation({ summary: 'Validate order data' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Order data is valid' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Order data is invalid' })
  async validateOrder(@Body() data: unknown) {
    return await this.validationService.validateOrder(data, {
      audit: true,
      metrics: true,
      cache: true,
    });
  }

  @Post('order-item')
  @ApiOperation({ summary: 'Validate order item data' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Order item data is valid' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Order item data is invalid' })
  async validateOrderItem(@Body() data: unknown) {
    return await this.validationService.validateOrderItem(data, {
      audit: true,
      metrics: true,
      cache: true,
    });
  }

  @Post('audit')
  @ApiOperation({ summary: 'Validate audit data' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Audit data is valid' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Audit data is invalid' })
  async validateAudit(@Body() data: unknown) {
    return await this.validationService.validateAudit(data, {
      audit: true,
      metrics: true,
      cache: true,
    });
  }

  @Post('batch')
  @ApiOperation({ summary: 'Batch validate multiple entities' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Batch validation completed' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Batch validation failed' })
  async validateBatch(@Body() data: { validations: Array<{ type: 'user' | 'product' | 'order' | 'orderItem' | 'audit'; data: unknown; options?: any }> }) {
    return await this.validationService.validateBatch(data.validations);
  }

  @Post('ab-test')
  @ApiOperation({ summary: 'A/B test validation' })
  @ApiResponse({ status: HttpStatus.OK, description: 'A/B test validation completed' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'A/B test validation failed' })
  async validateWithABTesting(@Body() data: unknown) {
    return await this.validationService.validateWithABTesting(data, {
      audit: true,
      metrics: true,
    });
  }

  @Post('realtime')
  @ApiOperation({ summary: 'Real-time validation' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Real-time validation completed' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Real-time validation failed' })
  async validateRealtime(@Body() data: unknown) {
    return await this.validationService.validateRealtime(data, {
      audit: true,
      metrics: true,
    });
  }
}

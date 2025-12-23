/**
 * Three-Phase Payment Controller
 * 
 * REST API endpoints for the traditional three-phase payment processing:
 * 1. Authorization - Verify payment method and reserve funds
 * 2. Capture - Actually charge the reserved funds
 * 3. Settlement - Transfer funds to merchant account
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ThreePhasePaymentService } from '../services/three-phase-payment.service';
import { z } from 'zod';

type AuthedRequest = {
  ip?: string;
  connection?: { remoteAddress?: string };
  headers?: Record<string, string | string[]>;
  user?: { id?: string; tenantId?: string };
};

@ApiTags('Three-Phase Payments')
@Controller('three-phase/payments')
export class ThreePhasePaymentController {
  private readonly logger = new Logger(ThreePhasePaymentController.name);

  constructor(
    private readonly threePhasePaymentService: ThreePhasePaymentService,
  ) {}

  @Post('authorize')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Phase 1: Authorize payment - Verify payment method and reserve funds' })
  @ApiResponse({ status: 201, description: 'Payment authorized successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async authorizePayment(
    @Body() request: Record<string, unknown>,
    @Request() req: AuthedRequest,
  ): Promise<any> {
    this.logger.log(`Authorizing payment for user ${req.user?.id}`);

    const hdr = (key: string) => {
      const v = req.headers?.[key];
      return Array.isArray(v) ? v[0] : v;
    };

    const context = {
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: hdr('user-agent'),
      requestId: hdr('x-request-id'),
    };

    return await this.threePhasePaymentService.authorizePayment(
      request,
      req.user?.id,
      req.user?.tenantId,
      context,
    );
  }

  @Post('capture')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Phase 2: Capture payment - Actually charge the reserved funds' })
  @ApiResponse({ status: 200, description: 'Payment captured successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 404, description: 'Authorization not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async capturePayment(
    @Body() request: Record<string, unknown>,
    @Request() req: AuthedRequest,
  ): Promise<any> {
    this.logger.log(`Capturing payment for user ${req.user?.id}`);

    const hdr = (key: string) => {
      const v = req.headers?.[key];
      return Array.isArray(v) ? v[0] : v;
    };

    const context = {
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: hdr('user-agent'),
      requestId: hdr('x-request-id'),
    };

    return await this.threePhasePaymentService.capturePayment(
      request,
      req.user?.id,
      req.user?.tenantId,
      context,
    );
  }

  @Post('settle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Phase 3: Settle payment - Transfer funds to merchant account' })
  @ApiResponse({ status: 200, description: 'Payment settled successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 404, description: 'Capture not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async settlePayment(
    @Body() request: Record<string, unknown>,
    @Request() req: AuthedRequest,
  ): Promise<any> {
    this.logger.log(`Settling payment for user ${req.user?.id}`);

    const hdr = (key: string) => {
      const v = req.headers?.[key];
      return Array.isArray(v) ? v[0] : v;
    };

    const context = {
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: hdr('user-agent'),
      requestId: hdr('x-request-id'),
    };

    return await this.threePhasePaymentService.settlePayment(
      request,
      req.user?.id,
      req.user?.tenantId,
      context,
    );
  }

  @Get('flow/:authorizationId')
  @ApiOperation({ summary: 'Get complete three-phase payment flow status' })
  @ApiResponse({ status: 200, description: 'Payment flow retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getPaymentFlow(
    @Param('authorizationId') authorizationId: string,
    @Request() req: AuthedRequest,
  ): Promise<any> {
    this.logger.log(`Getting payment flow for authorization ${authorizationId}`);

    return await this.threePhasePaymentService.getPaymentFlow(
      authorizationId,
      req.user?.id,
      req.user?.tenantId,
    );
  }

  @Delete('authorize/:authorizationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel authorization - Cancel reserved funds before capture' })
  @ApiResponse({ status: 204, description: 'Authorization cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Authorization not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async cancelAuthorization(
    @Param('authorizationId') authorizationId: string,
    @Request() req: AuthedRequest,
  ): Promise<void> {
    this.logger.log(`Cancelling authorization ${authorizationId} for user ${req.user?.id}`);

    await this.threePhasePaymentService.cancelAuthorization(
      authorizationId,
      req.user?.id,
      req.user?.tenantId,
    );
  }
}

/**
 * Enterprise Payment Controller
 * 
 * Advanced payment processing endpoints with fraud detection,
 * compliance validation, and real-time monitoring.
 */

import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EnterprisePaymentService } from '../services/enterprise-payment.service';
import { FraudDetectionService } from '../services/fraud-detection.service';
import { PaymentComplianceService } from '../services/payment-compliance.service';
import { PaymentMonitoringService } from '../services/payment-monitoring.service';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { UpdatePaymentDto } from '../dto/update-payment.dto';
import { PaymentResponseDto } from '../dto/payment-response.dto';
import { PaymentListResponseDto } from '../dto/payment-list-response.dto';
import { PaymentProvider, PaymentMethod } from '../entities/payment.entity';
import { z } from 'zod';

type AuthedRequest = {
  ip?: string;
  connection?: { remoteAddress?: string };
  headers?: Record<string, string | string[]>;
  user?: { id?: string; tenantId?: string };
};

// Enterprise-specific DTOs
export const EnterpriseCreatePaymentDto = z.object({
  amount: z.number().positive('Amount must be positive').max(999999.99, 'Amount too high'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  provider: z.enum(['STRIPE', 'BRAINTREE', 'PAYPAL', 'SQUARE', 'ADYEN']),
  method: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'DIGITAL_WALLET', 'CRYPTOCURRENCY']),
  customerEmail: z.string().email('Invalid customer email'),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  metadata: z.record(z.unknown()).optional(),
  billingAddress: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'ZIP code is required'),
    country: z.string().length(2, 'Country code must be 2 characters'),
  }).optional(),
  fraudDetection: z.object({
    enabled: z.boolean().default(true),
    riskThreshold: z.number().min(0).max(1).default(0.7),
    customRules: z.array(z.string()).optional(),
  }).optional(),
  compliance: z.object({
    pciCompliant: z.boolean().default(true),
    gdprCompliant: z.boolean().default(true),
    auditTrail: z.boolean().default(true),
    dataRetention: z.number().int().min(30).max(2555).default(2555),
  }).optional(),
  retryPolicy: z.object({
    maxRetries: z.number().int().min(0).max(5).default(3),
    retryDelay: z.number().int().min(1000).max(30000).default(5000),
    exponentialBackoff: z.boolean().default(true),
  }).optional(),
});

export const FraudDetectionRequestDto = z.object({
  paymentData: z.object({
    amount: z.number().positive(),
    currency: z.string(),
    customerEmail: z.string().email(),
    billingAddress: z.object({
      country: z.string(),
      state: z.string(),
      city: z.string(),
    }).optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
  context: z.object({
    userId: z.string().uuid(),
    ipAddress: z.string().ip(),
    userAgent: z.string().optional(),
    deviceFingerprint: z.object({
      userAgent: z.string(),
      screenResolution: z.string(),
      timezone: z.string(),
      language: z.string(),
      platform: z.string(),
      cookieEnabled: z.boolean(),
      doNotTrack: z.boolean(),
      fingerprint: z.string(),
    }).optional(),
    sessionId: z.string().optional(),
  }),
  config: z.object({
    enabled: z.boolean().default(true),
    riskThreshold: z.number().min(0).max(1).default(0.7),
    maxDailyAmount: z.number().positive().default(50000),
    maxDailyTransactions: z.number().int().positive().default(100),
    geoBlocking: z.boolean().default(true),
    deviceFingerprinting: z.boolean().default(true),
    behavioralAnalysis: z.boolean().default(true),
    machineLearning: z.boolean().default(true),
    customRules: z.array(z.string()).optional(),
  }),
});

export const ComplianceAuditRequestDto = z.object({
  complianceType: z.enum(['PCI_DSS', 'GDPR', 'SOX', 'HIPAA', 'CUSTOM']),
  auditor: z.string().min(1, 'Auditor name is required'),
  customRules: z.array(z.string()).optional(),
});

export const MonitoringDashboardQueryDto = z.object({
  timeRange: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
  granularity: z.enum(['minute', 'hour', 'day']).default('hour'),
  includeAlerts: z.boolean().default(true),
  includeTrends: z.boolean().default(true),
});

@ApiTags('Enterprise Payments')
@Controller('enterprise/payments')
export class EnterprisePaymentController {
  private readonly logger = new Logger(EnterprisePaymentController.name);

  constructor(
    private readonly enterprisePaymentService: EnterprisePaymentService,
    private readonly fraudDetectionService: FraudDetectionService,
    private readonly paymentComplianceService: PaymentComplianceService,
    private readonly paymentMonitoringService: PaymentMonitoringService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create enterprise payment with fraud detection and compliance' })
  @ApiResponse({ status: 201, description: 'Payment created successfully', type: PaymentResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed or fraud detected' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createEnterprisePayment(
    @Body() createPaymentDto: Record<string, unknown>,
    @Request() req: AuthedRequest,
  ): Promise<PaymentResponseDto> {
    this.logger.log(`Creating enterprise payment for user ${req.user?.id}`);

    // Validate request data
    const validationResult = EnterpriseCreatePaymentDto.safeParse(createPaymentDto);
    if (!validationResult.success) {
      throw new Error(`Validation failed: ${validationResult.error.message}`);
    }

    const hdr = (key: string) => {
      const v = req.headers?.[key];
      return Array.isArray(v) ? v[0] : v;
    };

    const context = {
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: hdr('user-agent'),
      requestId: hdr('x-request-id'),
    };

    return await this.enterprisePaymentService.createEnterprisePayment(
      {
        amount: validationResult.data.amount || 0,
        currency: validationResult.data.currency || 'USD',
        provider: (validationResult.data.provider as PaymentProvider) || PaymentProvider.STRIPE,
        method: (validationResult.data.method as PaymentMethod) || PaymentMethod.CARD,
        description: validationResult.data.description || '',
        customerEmail: validationResult.data.customerEmail || '',
        metadata: validationResult.data.metadata || {},
        tenantId: req.user?.tenantId,
      },
      req.user?.id,
      req.user?.tenantId,
      context,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get payments with advanced filtering and analytics' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully', type: PaymentListResponseDto })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Payment status filter' })
  @ApiQuery({ name: 'provider', required: false, type: String, description: 'Payment provider filter' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date filter (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date filter (ISO string)' })
  @ApiQuery({ name: 'minAmount', required: false, type: Number, description: 'Minimum amount filter' })
  @ApiQuery({ name: 'maxAmount', required: false, type: Number, description: 'Maximum amount filter' })
  @ApiQuery({ name: 'fraudDetected', required: false, type: Boolean, description: 'Filter by fraud detection' })
  async getPayments(
    @Query() query: Record<string, unknown>,
    @Request() req: AuthedRequest,
  ): Promise<PaymentListResponseDto> {
    this.logger.log(`Getting payments for user ${req.user?.id} with filters: ${JSON.stringify(query)}`);

    const q = query as Record<string, unknown>;
    const page = typeof q.page === 'string' ? parseInt(q.page, 10) : 1;
    const limit = typeof q.limit === 'string' ? parseInt(q.limit, 10) : 20;
    const status = typeof q.status === 'string' ? q.status : undefined;
    const provider = typeof q.provider === 'string' ? q.provider : undefined;
    const startDate = typeof q.startDate === 'string' ? new Date(q.startDate) : undefined;
    const endDate = typeof q.endDate === 'string' ? new Date(q.endDate) : undefined;
    const minAmount = typeof q.minAmount === 'string' ? parseFloat(q.minAmount) : undefined;
    const maxAmount = typeof q.maxAmount === 'string' ? parseFloat(q.maxAmount) : undefined;
    const fraudDetected = q.fraudDetected === 'true' || q.fraudDetected === true;

    const filters = { page, limit, status, provider, startDate, endDate, minAmount, maxAmount, fraudDetected };

    return await this.enterprisePaymentService.getPayments(
      req.user?.id,
      req.user?.tenantId,
      filters,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID with detailed information' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully', type: PaymentResponseDto })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPayment(
    @Param('id') id: string,
    @Request() req: AuthedRequest,
  ): Promise<PaymentResponseDto> {
    this.logger.log(`Getting payment ${id} for user ${req.user?.id}`);

    return await this.enterprisePaymentService.getPayment(
      id,
      req.user?.id,
      req.user?.tenantId,
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update payment with compliance validation' })
  @ApiResponse({ status: 200, description: 'Payment updated successfully', type: PaymentResponseDto })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  async updatePayment(
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
    @Request() req: AuthedRequest,
  ): Promise<any> {
    this.logger.log(`Updating payment ${id} for user ${req.user?.id}`);

    return await this.enterprisePaymentService.updatePayment(
      id,
      updatePaymentDto as Record<string, unknown>,
      req.user?.id,
      req.user?.tenantId,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel payment with audit trail' })
  @ApiResponse({ status: 204, description: 'Payment cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 400, description: 'Bad request - cannot cancel payment' })
  async cancelPayment(
    @Param('id') id: string,
    @Request() req: AuthedRequest,
  ): Promise<void> {
    this.logger.log(`Cancelling payment ${id} for user ${req.user?.id}`);

    await this.enterprisePaymentService.cancelPayment(
      id,
      req.user?.id,
      req.user?.tenantId,
    );
  }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Refund payment with compliance validation' })
  @ApiResponse({ status: 200, description: 'Refund processed successfully', type: PaymentResponseDto })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @ApiResponse({ status: 400, description: 'Bad request - cannot refund payment' })
  async refundPayment(
    @Param('id') id: string,
    @Body() refundData: { amount?: number; reason?: string },
    @Request() req: AuthedRequest,
  ): Promise<PaymentResponseDto> {
    this.logger.log(`Refunding payment ${id} for user ${req.user?.id}`);

    return await this.enterprisePaymentService.refundPayment(
      id,
      refundData,
      req.user?.id,
      req.user?.tenantId,
    );
  }

  @Post('fraud-detection/assess')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assess fraud risk for payment data' })
  @ApiResponse({ status: 200, description: 'Fraud risk assessment completed' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  async assessFraudRisk(
    @Body() requestData: Record<string, unknown>,
    @Request() req: AuthedRequest,
  ): Promise<any> {
    this.logger.log(`Assessing fraud risk for user ${req.user?.id}`);

    // Validate request data
    const validationResult = FraudDetectionRequestDto.safeParse(requestData);
    if (!validationResult.success) {
      throw new Error(`Validation failed: ${validationResult.error.message}`);
    }

    const hdr = (key: string) => {
      const v = req.headers?.[key];
      return Array.isArray(v) ? v[0] : v;
    };

    return await this.fraudDetectionService.assessFraudRisk(
      {
        amount: validationResult.data.paymentData.amount || 0,
        currency: validationResult.data.paymentData.currency || 'USD',
        customerEmail: validationResult.data.paymentData.customerEmail || '',
        billingAddress: validationResult.data.paymentData.billingAddress,
        metadata: validationResult.data.paymentData.metadata,
      },
      {
        userId: validationResult.data.context.userId || req.user?.id || '',
        ipAddress: validationResult.data.context.ipAddress || req.ip || '127.0.0.1',
        ...(validationResult.data.context.userAgent && { userAgent: validationResult.data.context.userAgent }),
        ...(validationResult.data.context.deviceFingerprint && {
          deviceFingerprint: {
            userAgent: validationResult.data.context.deviceFingerprint.userAgent || hdr('user-agent') || '',
            screenResolution: validationResult.data.context.deviceFingerprint.screenResolution || '',
            timezone: validationResult.data.context.deviceFingerprint.timezone || '',
            language: validationResult.data.context.deviceFingerprint.language || '',
            platform: validationResult.data.context.deviceFingerprint.platform || '',
            cookieEnabled: validationResult.data.context.deviceFingerprint.cookieEnabled || false,
            doNotTrack: validationResult.data.context.deviceFingerprint.doNotTrack || false,
            fingerprint: validationResult.data.context.deviceFingerprint.fingerprint || '',
          }
        }),
        ...(validationResult.data.context.sessionId && { sessionId: validationResult.data.context.sessionId }),
      },
      validationResult.data.config,
    );
  }

  @Post('compliance/audit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Perform compliance audit' })
  @ApiResponse({ status: 200, description: 'Compliance audit completed' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data' })
  async performComplianceAudit(
    @Body() requestData: Record<string, unknown>,
    @Request() req: AuthedRequest,
  ): Promise<any> {
    this.logger.log(`Performing compliance audit for tenant ${req.user?.tenantId}`);

    // Validate request data
    const validationResult = ComplianceAuditRequestDto.safeParse(requestData);
    if (!validationResult.success) {
      throw new Error(`Validation failed: ${validationResult.error.message}`);
    }

    return await this.paymentComplianceService.performComplianceAudit(
      validationResult.data.complianceType,
      req.user?.tenantId,
      validationResult.data.auditor,
    );
  }

  @Get('compliance/status')
  @ApiOperation({ summary: 'Get compliance status' })
  @ApiResponse({ status: 200, description: 'Compliance status retrieved' })
  async getComplianceStatus(
    @Request() req: AuthedRequest,
  ): Promise<any> {
    this.logger.log(`Getting compliance status for tenant ${req.user?.tenantId}`);

    return await this.paymentComplianceService.getComplianceStatus(req.user?.tenantId);
  }

  @Get('monitoring/dashboard')
  @ApiOperation({ summary: 'Get real-time monitoring dashboard' })
  @ApiResponse({ status: 200, description: 'Monitoring dashboard retrieved' })
  @ApiQuery({ name: 'timeRange', required: false, type: String, description: 'Time range for dashboard data' })
  @ApiQuery({ name: 'granularity', required: false, type: String, description: 'Data granularity' })
  @ApiQuery({ name: 'includeAlerts', required: false, type: Boolean, description: 'Include active alerts' })
  @ApiQuery({ name: 'includeTrends', required: false, type: Boolean, description: 'Include trend data' })
  async getMonitoringDashboard(
    @Query() _query: Record<string, unknown>,
    @Request() req: AuthedRequest,
  ): Promise<any> {
    this.logger.log(`Getting monitoring dashboard for tenant ${req.user?.tenantId}`);

    return await this.paymentMonitoringService.getMonitoringDashboard(req.user?.tenantId);
  }

  @Get('monitoring/metrics')
  @ApiOperation({ summary: 'Get payment metrics' })
  @ApiResponse({ status: 200, description: 'Payment metrics retrieved' })
  @ApiQuery({ name: 'startDate', required: true, type: String, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: true, type: String, description: 'End date (ISO string)' })
  @ApiQuery({ name: 'granularity', required: false, type: String, description: 'Data granularity' })
  async getPaymentMetrics(
    @Query() query: Record<string, unknown>,
    @Request() req: AuthedRequest,
  ): Promise<any> {
    this.logger.log(`Getting payment metrics for tenant ${req.user?.tenantId}`);

    const q = query as Record<string, unknown>;
    const startDate = typeof q.startDate === 'string' ? new Date(q.startDate) : new Date();
    const endDate = typeof q.endDate === 'string' ? new Date(q.endDate) : new Date();
    const granularity = (typeof q.granularity === 'string' ? q.granularity : 'hourly') as 'hourly' | 'daily' | 'weekly' | 'monthly';

    return await this.paymentMonitoringService.getPaymentMetrics(
      req.user?.tenantId,
      startDate,
      endDate,
      granularity,
    );
  }

  @Post('monitoring/alerts/configure')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Configure monitoring alerts' })
  @ApiResponse({ status: 200, description: 'Alert configuration updated' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid configuration' })
  async configureAlerts(
    @Body() config: Record<string, unknown>,
    @Request() req: AuthedRequest,
  ): Promise<void> {
    this.logger.log(`Configuring alerts for tenant ${req.user?.tenantId}`);

    await this.paymentMonitoringService.configureAlerts(req.user?.tenantId, config);
  }

  @Get('analytics/summary')
  @ApiOperation({ summary: 'Get payment analytics summary' })
  @ApiResponse({ status: 200, description: 'Analytics summary retrieved' })
  @ApiQuery({ name: 'period', required: false, type: String, description: 'Analysis period' })
  async getAnalyticsSummary(
    @Query() query: Record<string, unknown>,
    @Request() req: AuthedRequest,
  ): Promise<any> {
    this.logger.log(`Getting analytics summary for tenant ${req.user?.tenantId}`);

    const q = query as Record<string, unknown>;
    const period = typeof q.period === 'string' ? q.period : '30d';
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '1d':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    return await this.enterprisePaymentService.getPaymentMetrics(
      req.user?.tenantId,
      { start: startDate, end: endDate }
    );
  }
}

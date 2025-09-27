import { Controller, Post, Body, Query, Logger } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { EnterpriseDemoValidationService } from '../validation/enterprise-demo-validation.service';

@ApiTags('Enterprise Demo Validation')
@Controller('enterprise-demo/validate')
export class EnterpriseDemoValidationController {
  private readonly logger = new Logger(EnterpriseDemoValidationController.name);

  constructor(private readonly enterpriseDemoValidationService: EnterpriseDemoValidationService) {}

  @Post('user')
  @ApiOperation({ summary: 'Validate enterprise demo user data' })
  @ApiResponse({ status: 200, description: 'User validation successful' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiBody({ description: 'Enterprise demo user data to validate' })
  async validateUser(
    @Body() userData: unknown,
    @Query('locale') locale?: string
  ) {
    this.logger.log(`Received user validation request for locale: ${locale}`);
    const result = await this.enterpriseDemoValidationService.validateEnterpriseUser(userData, {
      locale: locale || 'en',
      audit: true,
      cache: true,
    });
    if (!result.success) {
      this.logger.warn(`User validation failed: ${JSON.stringify(result.errors)}`);
      return { success: false, errors: result.errors };
    }
    this.logger.log('User validation successful');
    return { success: true, data: result.data };
  }

  @Post('product')
  @ApiOperation({ summary: 'Validate enterprise demo product data' })
  @ApiResponse({ status: 200, description: 'Product validation successful' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiBody({ description: 'Enterprise demo product data to validate' })
  async validateProduct(
    @Body() productData: unknown,
    @Query('locale') locale?: string
  ) {
    this.logger.log(`Received product validation request for locale: ${locale}`);
    const result = await this.enterpriseDemoValidationService.validateEnterpriseProduct(productData, {
      locale: locale || 'en',
      audit: true,
      cache: true,
    });
    if (!result.success) {
      this.logger.warn(`Product validation failed: ${JSON.stringify(result.errors)}`);
      return { success: false, errors: result.errors };
    }
    this.logger.log('Product validation successful');
    return { success: true, data: result.data };
  }

  @Post('order')
  @ApiOperation({ summary: 'Validate enterprise demo order data' })
  @ApiResponse({ status: 200, description: 'Order validation successful' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiBody({ description: 'Enterprise demo order data to validate' })
  async validateOrder(
    @Body() orderData: unknown,
    @Query('locale') locale?: string
  ) {
    this.logger.log(`Received order validation request for locale: ${locale}`);
    const result = await this.enterpriseDemoValidationService.validateEnterpriseOrder(orderData, {
      locale: locale || 'en',
      audit: true,
      cache: true,
    });
    if (!result.success) {
      this.logger.warn(`Order validation failed: ${JSON.stringify(result.errors)}`);
      return { success: false, errors: result.errors };
    }
    this.logger.log('Order validation successful');
    return { success: true, data: result.data };
  }

  @Post('integration')
  @ApiOperation({ summary: 'Validate enterprise demo integration data' })
  @ApiResponse({ status: 200, description: 'Integration validation successful' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiBody({ description: 'Enterprise demo integration data to validate' })
  async validateIntegration(
    @Body() integrationData: unknown,
    @Query('locale') locale?: string
  ) {
    this.logger.log(`Received integration validation request for locale: ${locale}`);
    const result = await this.enterpriseDemoValidationService.validateEnterpriseIntegration(integrationData, {
      locale: locale || 'en',
      audit: true,
      cache: true,
    });
    if (!result.success) {
      this.logger.warn(`Integration validation failed: ${JSON.stringify(result.errors)}`);
      return { success: false, errors: result.errors };
    }
    this.logger.log('Integration validation successful');
    return { success: true, data: result.data };
  }

  @Post('audit')
  @ApiOperation({ summary: 'Validate enterprise demo audit data' })
  @ApiResponse({ status: 200, description: 'Audit validation successful' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiBody({ description: 'Enterprise demo audit data to validate' })
  async validateAudit(
    @Body() auditData: unknown,
    @Query('locale') locale?: string
  ) {
    this.logger.log(`Received audit validation request for locale: ${locale}`);
    const result = await this.enterpriseDemoValidationService.validateEnterpriseAudit(auditData, {
      locale: locale || 'en',
      audit: true,
      cache: true,
    });
    if (!result.success) {
      this.logger.warn(`Audit validation failed: ${JSON.stringify(result.errors)}`);
      return { success: false, errors: result.errors };
    }
    this.logger.log('Audit validation successful');
    return { success: true, data: result.data };
  }

  @Post('batch')
  @ApiOperation({ summary: 'Batch validate multiple enterprise demo entities' })
  @ApiResponse({ status: 200, description: 'Batch validation successful' })
  @ApiResponse({ status: 400, description: 'Batch validation failed' })
  @ApiBody({ description: 'Array of enterprise demo entities to validate' })
  async batchValidate(
    @Body() entities: { type: 'user' | 'product' | 'order' | 'integration' | 'audit'; data: unknown }[],
  ) {
    this.logger.log(`Received batch validation request for ${entities.length} entities`);
    const result = await this.enterpriseDemoValidationService.batchValidateEnterpriseEntities(entities);
    if (result.failed > 0) {
      this.logger.warn(`Batch validation failed for ${result.failed} entities.`);
      return { success: false, ...result };
    }
    this.logger.log('Batch validation successful');
    return { success: true, ...result };
  }

  @Post('ab-test')
  @ApiOperation({ summary: 'Validate enterprise demo user data with A/B testing' })
  @ApiResponse({ status: 200, description: 'A/B test validation successful' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiBody({ description: 'Enterprise demo user data to validate' })
  async validateABTest(
    @Body() userData: unknown,
    @Query('variant') variant: string,
  ) {
    this.logger.log(`Received A/B test validation request for variant: ${variant}`);
    const result = await this.enterpriseDemoValidationService.validateWithABTesting(userData, 'user', variant);
    if (!result.success) {
      this.logger.warn(`A/B test validation failed: ${JSON.stringify(result.errors)}`);
      return { success: false, errors: result.errors };
    }
    this.logger.log('A/B test validation successful');
    return { success: true, data: result.data };
  }
}

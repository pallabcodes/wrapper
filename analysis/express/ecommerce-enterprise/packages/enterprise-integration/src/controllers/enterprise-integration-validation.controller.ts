import { Controller, Post, Body, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { EnterpriseIntegrationValidationService } from '../validation/enterprise-integration-validation.service';

@ApiTags('Enterprise Integration Validation')
@Controller('enterprise-integration/validate')
export class EnterpriseIntegrationValidationController {
  constructor(
    private readonly validationService: EnterpriseIntegrationValidationService,
  ) {}

  @Post('salesforce-connection')
  @ApiOperation({ summary: 'Validate Salesforce connection configuration' })
  @ApiResponse({ status: 200, description: 'Validation successful' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiQuery({ name: 'locale', required: false, description: 'Locale for error messages' })
  @ApiQuery({ name: 'audit', required: false, description: 'Enable audit logging' })
  @ApiQuery({ name: 'metrics', required: false, description: 'Enable metrics collection' })
  @ApiQuery({ name: 'cache', required: false, description: 'Enable caching' })
  async validateSalesforceConnection(
    @Body() data: unknown,
    @Query('locale') locale?: string,
    @Query('audit') audit?: boolean,
    @Query('metrics') metrics?: boolean,
    @Query('cache') cache?: boolean,
  ) {
    try {
      const result = await this.validationService.validateSalesforceConnection(data, {
        ...(locale && { locale }),
        ...(audit !== undefined && { audit }),
        ...(metrics !== undefined && { metrics }),
        ...(cache !== undefined && { cache }),
      });
      return {
        success: true,
        data: result,
        message: 'Salesforce connection validation successful',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Salesforce connection validation failed',
          error: (error as Error).message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('sap-connection')
  @ApiOperation({ summary: 'Validate SAP connection configuration' })
  @ApiResponse({ status: 200, description: 'Validation successful' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiQuery({ name: 'locale', required: false, description: 'Locale for error messages' })
  @ApiQuery({ name: 'audit', required: false, description: 'Enable audit logging' })
  @ApiQuery({ name: 'metrics', required: false, description: 'Enable metrics collection' })
  @ApiQuery({ name: 'cache', required: false, description: 'Enable caching' })
  async validateSAPConnection(
    @Body() data: unknown,
    @Query('locale') locale?: string,
    @Query('audit') audit?: boolean,
    @Query('metrics') metrics?: boolean,
    @Query('cache') cache?: boolean,
  ) {
    try {
      const result = await this.validationService.validateSAPConnection(data, {
        ...(locale && { locale }),
        ...(audit !== undefined && { audit }),
        ...(metrics !== undefined && { metrics }),
        ...(cache !== undefined && { cache }),
      });
      return {
        success: true,
        data: result,
        message: 'SAP connection validation successful',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'SAP connection validation failed',
          error: (error as Error).message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('integration-job')
  @ApiOperation({ summary: 'Validate integration job configuration' })
  @ApiResponse({ status: 200, description: 'Validation successful' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiQuery({ name: 'locale', required: false, description: 'Locale for error messages' })
  @ApiQuery({ name: 'audit', required: false, description: 'Enable audit logging' })
  @ApiQuery({ name: 'metrics', required: false, description: 'Enable metrics collection' })
  @ApiQuery({ name: 'cache', required: false, description: 'Enable caching' })
  async validateIntegrationJob(
    @Body() data: unknown,
    @Query('locale') locale?: string,
    @Query('audit') audit?: boolean,
    @Query('metrics') metrics?: boolean,
    @Query('cache') cache?: boolean,
  ) {
    try {
      const result = await this.validationService.validateIntegrationJob(data, {
        ...(locale && { locale }),
        ...(audit !== undefined && { audit }),
        ...(metrics !== undefined && { metrics }),
        ...(cache !== undefined && { cache }),
      });
      return {
        success: true,
        data: result,
        message: 'Integration job validation successful',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Integration job validation failed',
          error: (error as Error).message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('data-mapping')
  @ApiOperation({ summary: 'Validate data mapping configuration' })
  @ApiResponse({ status: 200, description: 'Validation successful' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiQuery({ name: 'locale', required: false, description: 'Locale for error messages' })
  @ApiQuery({ name: 'audit', required: false, description: 'Enable audit logging' })
  @ApiQuery({ name: 'metrics', required: false, description: 'Enable metrics collection' })
  @ApiQuery({ name: 'cache', required: false, description: 'Enable caching' })
  async validateDataMapping(
    @Body() data: unknown,
    @Query('locale') locale?: string,
    @Query('audit') audit?: boolean,
    @Query('metrics') metrics?: boolean,
    @Query('cache') cache?: boolean,
  ) {
    try {
      const result = await this.validationService.validateDataMapping(data, {
        ...(locale && { locale }),
        ...(audit !== undefined && { audit }),
        ...(metrics !== undefined && { metrics }),
        ...(cache !== undefined && { cache }),
      });
      return {
        success: true,
        data: result,
        message: 'Data mapping validation successful',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Data mapping validation failed',
          error: (error as Error).message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('integration-audit')
  @ApiOperation({ summary: 'Validate integration audit data' })
  @ApiResponse({ status: 200, description: 'Validation successful' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiQuery({ name: 'locale', required: false, description: 'Locale for error messages' })
  @ApiQuery({ name: 'audit', required: false, description: 'Enable audit logging' })
  @ApiQuery({ name: 'metrics', required: false, description: 'Enable metrics collection' })
  @ApiQuery({ name: 'cache', required: false, description: 'Enable caching' })
  async validateIntegrationAudit(
    @Body() data: unknown,
    @Query('locale') locale?: string,
    @Query('audit') audit?: boolean,
    @Query('metrics') metrics?: boolean,
    @Query('cache') cache?: boolean,
  ) {
    try {
      const result = await this.validationService.validateIntegrationAudit(data, {
        ...(locale && { locale }),
        ...(audit !== undefined && { audit }),
        ...(metrics !== undefined && { metrics }),
        ...(cache !== undefined && { cache }),
      });
      return {
        success: true,
        data: result,
        message: 'Integration audit validation successful',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Integration audit validation failed',
          error: (error as Error).message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('batch')
  @ApiOperation({ summary: 'Batch validate multiple integration entities' })
  @ApiResponse({ status: 200, description: 'Batch validation completed' })
  @ApiResponse({ status: 400, description: 'Batch validation failed' })
  async validateBatch(@Body() validations: Array<{
    type: 'salesforce' | 'sap' | 'job' | 'mapping' | 'audit';
    data: unknown;
    options?: {
      locale?: string;
      audit?: boolean;
      metrics?: boolean;
      cache?: boolean;
    };
  }>) {
    try {
      const result = await this.validationService.validateBatch(validations);
      return {
        success: true,
        data: result,
        message: 'Batch validation completed',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Batch validation failed',
          error: (error as Error).message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('ab-test')
  @ApiOperation({ summary: 'A/B test validation for integration jobs' })
  @ApiResponse({ status: 200, description: 'A/B test validation successful' })
  @ApiResponse({ status: 400, description: 'A/B test validation failed' })
  @ApiQuery({ name: 'locale', required: false, description: 'Locale for error messages' })
  @ApiQuery({ name: 'audit', required: false, description: 'Enable audit logging' })
  @ApiQuery({ name: 'metrics', required: false, description: 'Enable metrics collection' })
  async validateWithABTesting(
    @Body() data: unknown,
    @Query('locale') locale?: string,
    @Query('audit') audit?: boolean,
    @Query('metrics') metrics?: boolean,
  ) {
    try {
      const result = await this.validationService.validateWithABTesting(data, {
        ...(locale && { locale }),
        ...(audit !== undefined && { audit }),
        ...(metrics !== undefined && { metrics }),
      });
      return {
        success: true,
        data: result,
        message: 'A/B test validation successful',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'A/B test validation failed',
          error: (error as Error).message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('realtime')
  @ApiOperation({ summary: 'Real-time validation for integration jobs' })
  @ApiResponse({ status: 200, description: 'Real-time validation successful' })
  @ApiResponse({ status: 400, description: 'Real-time validation failed' })
  @ApiQuery({ name: 'locale', required: false, description: 'Locale for error messages' })
  @ApiQuery({ name: 'audit', required: false, description: 'Enable audit logging' })
  @ApiQuery({ name: 'metrics', required: false, description: 'Enable metrics collection' })
  async validateRealtime(
    @Body() data: unknown,
    @Query('locale') locale?: string,
    @Query('audit') audit?: boolean,
    @Query('metrics') metrics?: boolean,
  ) {
    try {
      const result = await this.validationService.validateRealtime(data, {
        ...(locale && { locale }),
        ...(audit !== undefined && { audit }),
        ...(metrics !== undefined && { metrics }),
      });
      return {
        success: true,
        data: result,
        message: 'Real-time validation successful',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Real-time validation failed',
          error: (error as Error).message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}

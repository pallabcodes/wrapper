/**
 * Mobile Validation Controller
 * 
 * This controller demonstrates how to use our enterprise Zod validation
 * in mobile-specific API endpoints with device-aware validation.
 */

import { Controller, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { MobileValidationService } from '../validation/mobile-validation.service';
// import { ZodValidationPipe } from '@ecommerce-enterprise/nest-zod';
import { ZodSecurityGuard } from '@ecommerce-enterprise/nest-zod';
import { ZodPerformanceGuard } from '@ecommerce-enterprise/nest-zod';

@ApiTags('Mobile Validation')
@Controller('mobile/validation')
@UseGuards(ZodSecurityGuard, ZodPerformanceGuard)
export class MobileValidationController {
  constructor(private readonly mobileValidationService: MobileValidationService) {}

  @Post('user')
  @ApiOperation({ summary: 'Validate mobile user data' })
  @ApiResponse({ status: 200, description: 'User validation successful' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiBody({ description: 'Mobile user data to validate' })
  async validateUser(
    @Body() userData: unknown,
    @Query('locale') locale?: string,
    @Query('deviceOptimized') deviceOptimized?: boolean
  ) {
    const result = await this.mobileValidationService.validateMobileUser(userData, {
      locale: locale || 'en',
      audit: true,
      cache: true,
      deviceOptimized: deviceOptimized || true
    });

    if (!result.success) {
      return {
        success: false,
        error: 'Validation failed',
        details: result.errors?.message,
        metadata: result.metadata
      };
    }

    return {
      success: true,
      data: result.data,
      metadata: result.metadata
    };
  }

  @Post('product')
  @ApiOperation({ summary: 'Validate mobile product data' })
  @ApiResponse({ status: 200, description: 'Product validation successful' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiBody({ description: 'Mobile product data to validate' })
  async validateProduct(
    @Body() productData: unknown,
    @Query('locale') locale?: string,
    @Query('imageOptimized') imageOptimized?: boolean
  ) {
    const result = await this.mobileValidationService.validateMobileProduct(productData, {
      locale: locale || 'en',
      audit: true,
      cache: true,
      imageOptimized: imageOptimized || true
    });

    if (!result.success) {
      return {
        success: false,
        error: 'Validation failed',
        details: result.errors?.message,
        metadata: result.metadata
      };
    }

    return {
      success: true,
      data: result.data,
      metadata: result.metadata
    };
  }

  @Post('order')
  @ApiOperation({ summary: 'Validate mobile order data' })
  @ApiResponse({ status: 200, description: 'Order validation successful' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiBody({ description: 'Mobile order data to validate' })
  async validateOrder(
    @Body() orderData: unknown,
    @Query('locale') locale?: string,
    @Query('locationAware') locationAware?: boolean
  ) {
    const result = await this.mobileValidationService.validateMobileOrder(orderData, {
      locale: locale || 'en',
      audit: true,
      cache: true,
      locationAware: locationAware || true
    });

    if (!result.success) {
      return {
        success: false,
        error: 'Validation failed',
        details: result.errors?.message,
        metadata: result.metadata
      };
    }

    return {
      success: true,
      data: result.data,
      metadata: result.metadata
    };
  }

  @Post('notification')
  @ApiOperation({ summary: 'Validate mobile notification data' })
  @ApiResponse({ status: 200, description: 'Notification validation successful' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiBody({ description: 'Mobile notification data to validate' })
  async validateNotification(
    @Body() notificationData: unknown,
    @Query('locale') locale?: string
  ) {
    const result = await this.mobileValidationService.validateMobileNotification(notificationData, {
      locale: locale || 'en',
      audit: true,
      cache: true
    });

    if (!result.success) {
      return {
        success: false,
        error: 'Validation failed',
        details: result.errors?.message,
        metadata: result.metadata
      };
    }

    return {
      success: true,
      data: result.data,
      metadata: result.metadata
    };
  }

  @Post('analytics')
  @ApiOperation({ summary: 'Validate mobile analytics data' })
  @ApiResponse({ status: 200, description: 'Analytics validation successful' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiBody({ description: 'Mobile analytics data to validate' })
  async validateAnalytics(
    @Body() analyticsData: unknown,
    @Query('locale') locale?: string
  ) {
    const result = await this.mobileValidationService.validateMobileAnalytics(analyticsData, {
      locale: locale || 'en',
      audit: true,
      cache: true
    });

    if (!result.success) {
      return {
        success: false,
        error: 'Validation failed',
        details: result.errors?.message,
        metadata: result.metadata
      };
    }

    return {
      success: true,
      data: result.data,
      metadata: result.metadata
    };
  }

  @Post('batch')
  @ApiOperation({ summary: 'Validate multiple mobile entities in batch' })
  @ApiResponse({ status: 200, description: 'Batch validation completed' })
  @ApiResponse({ status: 400, description: 'Some validations failed' })
  @ApiBody({ description: 'Array of mobile entities to validate' })
  async validateBatch(
    @Body() batchData: Array<{
      type: 'user' | 'product' | 'order' | 'notification' | 'analytics';
      data: unknown;
    }>,
    @Query('locale') locale?: string
  ) {
    const result = await this.mobileValidationService.validateMobileBatch(batchData, {
      locale: locale || 'en',
      audit: true,
      cache: true
    });

    return {
      success: result.success,
      summary: result.summary,
      results: result.results,
      metadata: {
        totalEntities: result.summary.total,
        successfulValidations: result.summary.successful,
        failedValidations: result.summary.failed,
        successRate: (result.summary.successful / result.summary.total) * 100
      }
    };
  }

  @Post('device-aware/:entityType/:platform')
  @ApiOperation({ summary: 'Validate with device awareness' })
  @ApiResponse({ status: 200, description: 'Device-aware validation successful' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiBody({ description: 'Data to validate with device awareness' })
  async validateWithDeviceAwareness(
    @Body() data: unknown,
    @Param('entityType') entityType: 'user' | 'product' | 'order',
    @Param('platform') platform: 'ios' | 'android' | 'web'
  ) {
    const result = await this.mobileValidationService.validateWithDeviceAwareness(
      data, 
      entityType, 
      platform
    );

    if (!result.success) {
      return {
        success: false,
        error: 'Device-aware validation failed',
        details: result.errors?.message,
        metadata: result.metadata
      };
    }

    return {
      success: true,
      data: result.data,
      metadata: result.metadata,
      deviceInfo: {
        platform,
        entityType,
        optimized: true
      }
    };
  }

  @Post('realtime/:entityType')
  @ApiOperation({ summary: 'Real-time mobile validation' })
  @ApiResponse({ status: 200, description: 'Real-time validation successful' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiBody({ description: 'Data for real-time validation' })
  async validateRealtime(
    @Body() data: unknown,
    @Param('entityType') entityType: 'user' | 'product' | 'order'
  ) {
    const result = await this.mobileValidationService.validateRealtimeMobile(data, entityType);

    if (!result.success) {
      return {
        success: false,
        error: 'Real-time validation failed',
        details: result.errors?.message,
        metadata: result.metadata
      };
    }

    return {
      success: true,
      data: result.data,
      metadata: result.metadata,
      realtime: {
        entityType,
        broadcasted: true,
        channel: `mobile-validation-${entityType}`
      }
    };
  }

  @Post('ab-testing/:entityType/:platform')
  @ApiOperation({ summary: 'A/B testing validation for mobile' })
  @ApiResponse({ status: 200, description: 'A/B testing validation successful' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiBody({ description: 'Data for A/B testing validation' })
  async validateWithABTesting(
    @Body() data: unknown,
    @Param('entityType') entityType: 'user' | 'product' | 'order',
    @Param('platform') platform: 'ios' | 'android' | 'web',
    @Query('variant') variant?: string
  ) {
    const result = await this.mobileValidationService.validateWithMobileABTesting(
      data, 
      entityType, 
      variant || 'basic',
      platform
    );

    if (!result.success) {
      return {
        success: false,
        error: 'A/B testing validation failed',
        details: result.errors?.message,
        metadata: result.metadata
      };
    }

    return {
      success: true,
      data: result.data,
      metadata: result.metadata,
      abTesting: {
        entityType,
        platform,
        variant: variant || 'basic',
        tested: true
      }
    };
  }
}

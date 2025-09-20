import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { RequirePermissions } from '@ecommerce-enterprise/authx';
import { AnalyticsService } from '../services/analytics.service';
import { Context } from '../../shared/decorators/context.decorator';

@ApiTags('analytics')
@Controller('analytics')
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get payment statistics for the current tenant' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @RequirePermissions('payments:analytics')
  async getPaymentStats(
    @Context('tenantId') tenantId: string,
  ): Promise<any> {
    return this.analyticsService.getPaymentStats(tenantId);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue analytics' })
  @ApiResponse({ status: 200, description: 'Revenue data retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiQuery({ name: 'period', required: false, type: String, description: 'Time period (day, week, month, year)' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (YYYY-MM-DD)' })
  @RequirePermissions('payments:analytics')
  async getRevenueAnalytics(
    @Query('period') period: string = 'month',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Context('tenantId') tenantId: string,
  ): Promise<any> {
    return this.analyticsService.getRevenueAnalytics(tenantId, {
      period,
      startDate,
      endDate,
    });
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get transaction analytics' })
  @ApiResponse({ status: 200, description: 'Transaction data retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiQuery({ name: 'period', required: false, type: String, description: 'Time period (day, week, month, year)' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (YYYY-MM-DD)' })
  @RequirePermissions('payments:analytics')
  async getTransactionAnalytics(
    @Query('period') period: string = 'month',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Context('tenantId') tenantId: string,
  ): Promise<any> {
    return this.analyticsService.getTransactionAnalytics(tenantId, {
      period,
      startDate,
      endDate,
    });
  }

  @Get('providers')
  @ApiOperation({ summary: 'Get payment provider analytics' })
  @ApiResponse({ status: 200, description: 'Provider data retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiQuery({ name: 'period', required: false, type: String, description: 'Time period (day, week, month, year)' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (YYYY-MM-DD)' })
  @RequirePermissions('payments:analytics')
  async getProviderAnalytics(
    @Query('period') period: string = 'month',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Context('tenantId') tenantId: string,
  ): Promise<any> {
    return this.analyticsService.getProviderAnalytics(tenantId, {
      period,
      startDate,
      endDate,
    });
  }
}

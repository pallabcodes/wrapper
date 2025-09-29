import { Controller, Get, Post, Body, Param, Query, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ReportsService } from '../services/reports.service';
import { 
  ReportType, 
  ReportGenerationRequest, 
  ReportQuery,
  EngagementReportParams,
  CommerceReportParams,
  CustomReportParams
} from '../types/report.types';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all reports with optional filtering' })
  @ApiResponse({ status: 200, description: 'List of reports retrieved successfully' })
  async getReports(@Query() query: ReportQuery) {
    return await this.reportsService.queryReports(query);
  }

  @Get('types')
  @ApiOperation({ summary: 'Get available report types' })
  @ApiResponse({ status: 200, description: 'List of available report types' })
  async getReportTypes() {
    return {
      types: this.reportsService.getAvailableReportTypes(),
      descriptions: this.getReportTypeDescriptions()
    };
  }

  @Get('types/:type/schema')
  @ApiOperation({ summary: 'Get schema for a specific report type' })
  @ApiResponse({ status: 200, description: 'Report type schema retrieved successfully' })
  async getReportTypeSchema(@Param('type') type: ReportType) {
    return this.reportsService.getReportTypeSchema(type);
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate a new report' })
  @ApiBody({ 
    description: 'Report generation request',
    schema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: Object.values(ReportType) },
        name: { type: 'string' },
        parameters: { type: 'object' },
        options: { type: 'object' }
      },
      required: ['type', 'parameters']
    }
  })
  @ApiResponse({ status: 201, description: 'Report generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid report parameters' })
  async generateReport(@Body() request: ReportGenerationRequest) {
    return await this.reportsService.generateReportFromRequest(request);
  }

  @Post('generate/engagement')
  @ApiOperation({ summary: 'Generate an engagement report' })
  @ApiBody({ 
    description: 'Engagement report parameters',
    schema: {
      type: 'object',
      properties: {
        timeRange: {
          type: 'object',
          properties: {
            start: { type: 'string', format: 'date-time' },
            end: { type: 'string', format: 'date-time' },
            timezone: { type: 'string' }
          },
          required: ['start', 'end']
        },
        eventTypes: { type: 'array', items: { type: 'string' } },
        includeScrollDepth: { type: 'boolean' },
        includeHoverEvents: { type: 'boolean' },
        includeClickEvents: { type: 'boolean' },
        minSessionDuration: { type: 'number' },
        maxSessionDuration: { type: 'number' }
      },
      required: ['timeRange']
    }
  })
  @ApiResponse({ status: 201, description: 'Engagement report generated successfully' })
  async generateEngagementReport(@Body() params: EngagementReportParams) {
    return await this.reportsService.generateReport(ReportType.ENGAGEMENT, params);
  }

  @Post('generate/commerce')
  @ApiOperation({ summary: 'Generate a commerce report' })
  @ApiBody({ 
    description: 'Commerce report parameters',
    schema: {
      type: 'object',
      properties: {
        timeRange: {
          type: 'object',
          properties: {
            start: { type: 'string', format: 'date-time' },
            end: { type: 'string', format: 'date-time' },
            timezone: { type: 'string' }
          },
          required: ['start', 'end']
        },
        includeCartAbandonment: { type: 'boolean' },
        includePurchaseFlow: { type: 'boolean' },
        includeProductViews: { type: 'boolean' },
        includeDiscountUsage: { type: 'boolean' },
        minOrderValue: { type: 'number' },
        maxOrderValue: { type: 'number' },
        currency: { type: 'string' }
      },
      required: ['timeRange']
    }
  })
  @ApiResponse({ status: 201, description: 'Commerce report generated successfully' })
  async generateCommerceReport(@Body() params: CommerceReportParams) {
    return await this.reportsService.generateReport(ReportType.COMMERCE, params);
  }

  @Post('generate/custom')
  @ApiOperation({ summary: 'Generate a custom report' })
  @ApiBody({ 
    description: 'Custom report parameters',
    schema: {
      type: 'object',
      properties: {
        timeRange: {
          type: 'object',
          properties: {
            start: { type: 'string', format: 'date-time' },
            end: { type: 'string', format: 'date-time' },
            timezone: { type: 'string' }
          },
          required: ['start', 'end']
        },
        customEventTypes: { type: 'array', items: { type: 'string' } },
        customFilters: { type: 'object' },
        customGrouping: { type: 'array', items: { type: 'string' } },
        customMetrics: { type: 'array', items: { type: 'string' } },
        customCalculations: { type: 'object' }
      },
      required: ['timeRange']
    }
  })
  @ApiResponse({ status: 201, description: 'Custom report generated successfully' })
  async generateCustomReport(@Body() params: CustomReportParams) {
    return await this.reportsService.generateReport(ReportType.CUSTOM, params);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get report by ID' })
  @ApiResponse({ status: 200, description: 'Report retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async getReportById(@Param('id') id: string) {
    return await this.reportsService.getReportById(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete report by ID' })
  @ApiResponse({ status: 200, description: 'Report deleted successfully' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async deleteReport(@Param('id') id: string) {
    await this.reportsService.deleteReport(id);
    return { message: 'Report deleted successfully' };
  }

  private getReportTypeDescriptions(): Record<string, string> {
    return {
      [ReportType.ENGAGEMENT]: 'User engagement metrics including clicks, views, and interactions',
      [ReportType.COMMERCE]: 'E-commerce metrics including purchases, cart abandonment, and product views',
      [ReportType.DISCOVERY]: 'Search and discovery metrics including search terms and filter usage',
      [ReportType.AUTHENTICATION]: 'User authentication metrics including logins, signups, and security events',
      [ReportType.CONTENT]: 'Content consumption metrics including video views, downloads, and shares',
      [ReportType.SOCIAL]: 'Social interaction metrics including likes, comments, and follows',
      [ReportType.TECHNICAL]: 'Technical performance metrics including errors and response times',
      [ReportType.BUSINESS]: 'Business intelligence metrics including A/B tests and feature usage',
      [ReportType.MOBILE]: 'Mobile app metrics including app opens, push notifications, and in-app purchases',
      [ReportType.CUSTOM]: 'Custom report with user-defined parameters and metrics',
      [ReportType.SUMMARY]: 'High-level summary of all analytics data',
      [ReportType.TREND]: 'Trend analysis over time periods',
      [ReportType.PERFORMANCE]: 'System performance and optimization metrics',
      [ReportType.GEOGRAPHIC]: 'Geographic distribution of users and events',
      [ReportType.DEVICE]: 'Device and platform usage metrics',
      [ReportType.USER_JOURNEY]: 'User journey and path analysis',
      [ReportType.FUNNEL]: 'Conversion funnel analysis',
      [ReportType.CONVERSION]: 'Conversion rate and attribution analysis',
      [ReportType.RETENTION]: 'User retention and churn analysis',
      [ReportType.COHORT]: 'Cohort analysis and user segmentation',
    };
  }
}

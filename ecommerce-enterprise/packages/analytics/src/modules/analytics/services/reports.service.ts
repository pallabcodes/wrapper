import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { 
  ReportType, 
  ReportParams, 
  ReportResult, 
  ReportGenerationRequest,
  ReportQuery,
  isEngagementReportParams,
  isCommerceReportParams,
  isCustomReportParams
} from '../types/report.types';
import { AnalyticsMetrics } from '../interfaces/analytics-metrics.interface';

/**
 * Schema definition for report types
 */
interface ReportTypeSchema {
  type: ReportType;
  description: string;
  parameters: ReportTypeParameters;
  requiredFields: string[];
  optionalFields: string[];
}

/**
 * Parameters for report type schema
 */
interface ReportTypeParameters {
  timeRange: {
    start: Date;
    end: Date;
    timezone?: string;
  };
  [key: string]: Date | string | number | boolean | string[] | { start: Date; end: Date; timezone?: string } | undefined;
}

/**
 * Custom report data structure
 */
interface CustomReportData {
  customData: string;
  parameters: ReportParams;
  generatedAt: Date;
  customMetrics?: Record<string, number | string | boolean>;
  customCalculations?: Record<string, number>;
}

/**
 * Generic report data structure
 */
interface GenericReportData {
  reportType: ReportType;
  parameters: ReportParams;
  generatedAt: Date;
  message: string;
  metadata?: Record<string, string | number | boolean>;
}

/**
 * Sanitized report parameters for logging
 */
interface SanitizedReportParams {
  timeRange: {
    start: Date;
    end: Date;
    timezone?: string;
  };
  userIds?: string | string[];
  sessionIds?: string | string[];
  [key: string]: Date | string | number | boolean | string[] | { start: Date; end: Date; timezone?: string } | Record<string, unknown> | undefined;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  /**
   * Generate a report based on type and parameters
   */
  async generateReport(type: ReportType, params: ReportParams): Promise<ReportResult> {
    this.logger.log(`Generating ${type} report`, { 
      type, 
      params: this.sanitizeParamsForLogging(params) 
    });

    try {
      // Validate parameters based on report type
      this.validateReportParams(type, params);

      // Generate report data based on type
      const reportData = await this.generateReportData(type, params);

      const reportResult: ReportResult = {
        id: this.generateReportId(),
        type,
        name: this.generateReportName(type, params),
        data: reportData as AnalyticsMetrics | Record<string, unknown>,
        metadata: {
          generatedAt: new Date(),
          generatedBy: 'system', // In real implementation, this would be the user ID
          parameters: params,
          processingTime: 0, // In real implementation, this would be calculated
          recordCount: this.getRecordCount(reportData),
          schemaVersion: '1.0.0',
        },
        status: 'completed',
      };

      this.logger.log(`Successfully generated ${type} report`, { 
        reportId: reportResult.id,
        recordCount: reportResult.metadata.recordCount
      });

      return reportResult;
    } catch (error) {
      this.logger.error(`Failed to generate ${type} report`, error);
      
      return {
        id: this.generateReportId(),
        type,
        name: this.generateReportName(type, params),
        data: {},
        metadata: {
          generatedAt: new Date(),
          generatedBy: 'system',
          parameters: params,
          processingTime: 0,
          recordCount: 0,
          schemaVersion: '1.0.0',
        },
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Generate a report from a complete request
   */
  async generateReportFromRequest(request: ReportGenerationRequest): Promise<ReportResult> {
    this.logger.log(`Generating report from request`, { 
      type: request.type,
      name: request.name,
      options: request.options
    });

    return this.generateReport(request.type, request.parameters);
  }

  /**
   * Get a report by ID
   */
  async getReportById(id: string): Promise<ReportResult> {
    this.logger.log(`Getting report ${id}`);
    
    // In real implementation, this would fetch from database
    // For now, return a mock response
    throw new NotFoundException(`Report with ID ${id} not found`);
  }

  /**
   * Query reports with filters
   */
  async queryReports(query: ReportQuery): Promise<{ reports: ReportResult[]; total: number }> {
    this.logger.log(`Querying reports`, { query });
    
    // In real implementation, this would query the database
    // For now, return empty results
    return { reports: [], total: 0 };
  }

  /**
   * Delete a report by ID
   */
  async deleteReport(id: string): Promise<void> {
    this.logger.log(`Deleting report ${id}`);
    
    // In real implementation, this would delete from database
    throw new NotFoundException(`Report with ID ${id} not found`);
  }

  /**
   * Get available report types
   */
  getAvailableReportTypes(): ReportType[] {
    return Object.values(ReportType);
  }

  /**
   * Get report type schema/parameters
   */
  getReportTypeSchema(type: ReportType): ReportTypeSchema {
    // In real implementation, this would return the schema for the report type
    return {
      type,
      description: `Schema for ${type} report`,
      parameters: this.getDefaultParametersForType(type),
      requiredFields: this.getRequiredFieldsForType(type),
      optionalFields: this.getOptionalFieldsForType(type),
    };
  }

  private validateReportParams(type: ReportType, params: ReportParams): void {
    // Basic validation - in real implementation, this would be more comprehensive
    if (!params.timeRange) {
      throw new BadRequestException('Time range is required for all reports');
    }

    if (!params.timeRange.start || !params.timeRange.end) {
      throw new BadRequestException('Both start and end dates are required');
    }

    if (params.timeRange.start >= params.timeRange.end) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Type-specific validation
    switch (type) {
      case ReportType.ENGAGEMENT:
        if (!isEngagementReportParams(params)) {
          throw new BadRequestException('Invalid parameters for engagement report');
        }
        break;
      case ReportType.COMMERCE:
        if (!isCommerceReportParams(params)) {
          throw new BadRequestException('Invalid parameters for commerce report');
        }
        break;
      case ReportType.CUSTOM:
        if (!isCustomReportParams(params)) {
          throw new BadRequestException('Invalid parameters for custom report');
        }
        break;
      // Add more type-specific validations as needed
    }
  }

  private async generateReportData(type: ReportType, params: ReportParams): Promise<AnalyticsMetrics | CustomReportData | GenericReportData> {
    // In real implementation, this would generate actual report data
    // For now, return mock data based on report type
    const paramsAsRecord = params as unknown as Record<string, unknown>;
    
    switch (type) {
      case ReportType.ENGAGEMENT:
        return this.generateEngagementReportData(paramsAsRecord);
      case ReportType.COMMERCE:
        return this.generateCommerceReportData(paramsAsRecord);
      case ReportType.CUSTOM:
        return this.generateCustomReportData(paramsAsRecord);
      default:
        return this.generateGenericReportData(type, params);
    }
  }

  private generateEngagementReportData(_params: Record<string, unknown>): AnalyticsMetrics {
    return {
      totalEvents: 1000,
      eventsByType: { 'user_click': 500, 'page_view': 300, 'scroll': 200 },
      uniqueUsers: 100,
      uniqueSessions: 150,
      averageEventsPerUser: 10,
      topEventTypes: [
        { type: 'user_click', count: 500 },
        { type: 'page_view', count: 300 }
      ],
      totalBusinessValue: 1000,
      averageValuePerEvent: 1,
      valueByEventType: { 'user_click': 500, 'page_view': 300 },
      lastUpdated: new Date(),
      isRealtime: false,
    };
  }

  private generateCommerceReportData(_params: Record<string, unknown>): AnalyticsMetrics {
    return {
      totalEvents: 800,
      eventsByType: { 'add_to_cart': 200, 'purchase': 100, 'product_view': 500 },
      uniqueUsers: 80,
      uniqueSessions: 120,
      averageEventsPerUser: 10,
      topEventTypes: [
        { type: 'product_view', count: 500 },
        { type: 'add_to_cart', count: 200 }
      ],
      totalBusinessValue: 5000,
      averageValuePerEvent: 6.25,
      valueByEventType: { 'purchase': 5000, 'add_to_cart': 0 },
      lastUpdated: new Date(),
      isRealtime: false,
    };
  }

  private generateCustomReportData(params: Record<string, unknown>): CustomReportData {
    return {
      customData: 'Custom report data',
      parameters: params as unknown as ReportParams,
      generatedAt: new Date(),
      customMetrics: {
        totalCustomEvents: 150,
        averageCustomValue: 25.5,
        customSuccessRate: 0.85,
      },
      customCalculations: {
        customScore: 92.3,
        customTrend: 15.7,
      },
    };
  }

  private generateGenericReportData(type: ReportType, params: ReportParams): GenericReportData {
    return {
      reportType: type,
      parameters: params,
      generatedAt: new Date(),
      message: `${type} report generation not implemented yet`,
      metadata: {
        reportVersion: '1.0.0',
        generatedBy: 'system',
        processingTime: 0,
        recordCount: 0,
      },
    };
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateReportName(type: ReportType, params: ReportParams): string {
    const dateRange = `${params.timeRange.start.toISOString().split('T')[0]} to ${params.timeRange.end.toISOString().split('T')[0]}`;
    return `${type.charAt(0).toUpperCase() + type.slice(1)} Report - ${dateRange}`;
  }

  private getRecordCount(data: AnalyticsMetrics | CustomReportData | GenericReportData): number {
    if ('totalEvents' in data && typeof data.totalEvents === 'number') {
      return data.totalEvents;
    }
    if ('customMetrics' in data && data.customMetrics && 'totalCustomEvents' in data.customMetrics) {
      return data.customMetrics['totalCustomEvents'] as number;
    }
    if ('metadata' in data && data.metadata && 'recordCount' in data.metadata) {
      return data.metadata['recordCount'] as number;
    }
    return 0;
  }

  private sanitizeParamsForLogging(params: ReportParams): SanitizedReportParams {
    // Remove sensitive data and limit size for logging
    const sanitized: SanitizedReportParams = { ...params };
    if (sanitized['userIds'] && Array.isArray(sanitized['userIds'])) {
      sanitized['userIds'] = `[${sanitized['userIds'].length} user IDs]`;
    }
    if (sanitized['sessionIds'] && Array.isArray(sanitized['sessionIds'])) {
      sanitized['sessionIds'] = `[${sanitized['sessionIds'].length} session IDs]`;
    }
    return sanitized;
  }

  private getDefaultParametersForType(type: ReportType): ReportTypeParameters {
    const baseParams: ReportTypeParameters = {
      timeRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        end: new Date(),
      },
      includeRealtime: false,
      limit: 1000,
      offset: 0,
    };

    switch (type) {
      case ReportType.ENGAGEMENT:
        return { ...baseParams, includeScrollDepth: true, includeHoverEvents: true };
      case ReportType.COMMERCE:
        return { ...baseParams, includeCartAbandonment: true, includePurchaseFlow: true };
      case ReportType.CUSTOM:
        return { ...baseParams, customEventTypes: [], customFilters: '{}' };
      default:
        return baseParams;
    }
  }

  private getRequiredFieldsForType(type: ReportType): string[] {
    const commonRequired = ['timeRange'];
    
    switch (type) {
      case ReportType.ENGAGEMENT:
        return [...commonRequired, 'eventTypes'];
      case ReportType.COMMERCE:
        return [...commonRequired, 'includeCartAbandonment'];
      case ReportType.CUSTOM:
        return [...commonRequired, 'customEventTypes'];
      case ReportType.FUNNEL:
        return [...commonRequired, 'funnelSteps'];
      case ReportType.CONVERSION:
        return [...commonRequired, 'conversionEvents'];
      default:
        return commonRequired;
    }
  }

  private getOptionalFieldsForType(type: ReportType): string[] {
    const commonOptional = ['userIds', 'sessionIds', 'countries', 'regions', 'deviceTypes', 'browsers', 'operatingSystems', 'sources', 'mediums', 'campaigns', 'includeRealtime', 'limit', 'offset'];
    
    switch (type) {
      case ReportType.ENGAGEMENT:
        return [...commonOptional, 'includeScrollDepth', 'includeHoverEvents', 'includeClickEvents', 'minSessionDuration', 'maxSessionDuration'];
      case ReportType.COMMERCE:
        return [...commonOptional, 'includePurchaseFlow', 'includeProductViews', 'includeDiscountUsage', 'minOrderValue', 'maxOrderValue', 'currency'];
      case ReportType.CUSTOM:
        return [...commonOptional, 'customFilters', 'customGrouping', 'customMetrics', 'customCalculations'];
      case ReportType.FUNNEL:
        return [...commonOptional, 'includeStepMetrics', 'includeConversionRates', 'includeDropoffAnalysis', 'includeTimeToComplete', 'includeAbandonmentReasons', 'minStepDuration', 'maxStepDuration'];
      case ReportType.CONVERSION:
        return [...commonOptional, 'includeAttribution', 'includeLifetimeValue', 'includeRepeatPurchases', 'includeUpsells', 'includeCrossSells', 'minConversionValue', 'maxConversionValue'];
      default:
        return commonOptional;
    }
  }
}

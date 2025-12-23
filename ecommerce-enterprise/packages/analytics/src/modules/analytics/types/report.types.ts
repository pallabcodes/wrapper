import { EventType } from './event-type.enum';
import { AnalyticsMetrics } from '../interfaces/analytics-metrics.interface';

/**
 * Report types available in the analytics system
 */
export enum ReportType {
  ENGAGEMENT = 'engagement',
  COMMERCE = 'commerce',
  DISCOVERY = 'discovery',
  AUTHENTICATION = 'authentication',
  CONTENT = 'content',
  SOCIAL = 'social',
  TECHNICAL = 'technical',
  BUSINESS = 'business',
  MOBILE = 'mobile',
  CUSTOM = 'custom',
  SUMMARY = 'summary',
  TREND = 'trend',
  PERFORMANCE = 'performance',
  GEOGRAPHIC = 'geographic',
  DEVICE = 'device',
  USER_JOURNEY = 'user_journey',
  FUNNEL = 'funnel',
  CONVERSION = 'conversion',
  RETENTION = 'retention',
  COHORT = 'cohort',
}

/**
 * Time range for report generation
 */
export interface ReportTimeRange {
  start: Date;
  end: Date;
  timezone?: string;
}

/**
 * Common report parameters
 */
export interface BaseReportParams {
  timeRange: ReportTimeRange;
  userIds?: string[];
  sessionIds?: string[];
  countries?: string[];
  regions?: string[];
  deviceTypes?: string[];
  browsers?: string[];
  operatingSystems?: string[];
  sources?: string[];
  mediums?: string[];
  campaigns?: string[];
  includeRealtime?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Engagement report parameters
 */
export interface EngagementReportParams extends BaseReportParams {
  eventTypes?: EventType[];
  includeScrollDepth?: boolean;
  includeHoverEvents?: boolean;
  includeClickEvents?: boolean;
  minSessionDuration?: number;
  maxSessionDuration?: number;
}

/**
 * Commerce report parameters
 */
export interface CommerceReportParams extends BaseReportParams {
  includeCartAbandonment?: boolean;
  includePurchaseFlow?: boolean;
  includeProductViews?: boolean;
  includeDiscountUsage?: boolean;
  minOrderValue?: number;
  maxOrderValue?: number;
  currency?: string;
}

/**
 * Discovery report parameters
 */
export interface DiscoveryReportParams extends BaseReportParams {
  searchTerms?: string[];
  includeNoResults?: boolean;
  includeFilterUsage?: boolean;
  includeSortUsage?: boolean;
  minSearchResults?: number;
  maxSearchResults?: number;
}

/**
 * Authentication report parameters
 */
export interface AuthenticationReportParams extends BaseReportParams {
  includeFailedAttempts?: boolean;
  includePasswordResets?: boolean;
  includeProfileUpdates?: boolean;
  includeAccountDeletions?: boolean;
  minLoginAttempts?: number;
}

/**
 * Content report parameters
 */
export interface ContentReportParams extends BaseReportParams {
  contentTypes?: string[];
  includeVideoMetrics?: boolean;
  includeDownloadMetrics?: boolean;
  includeShareMetrics?: boolean;
  includeRatingMetrics?: boolean;
  minVideoDuration?: number;
  maxVideoDuration?: number;
}

/**
 * Social report parameters
 */
export interface SocialReportParams extends BaseReportParams {
  includeFollowMetrics?: boolean;
  includeLikeMetrics?: boolean;
  includeCommentMetrics?: boolean;
  includeShareMetrics?: boolean;
  includeCommunityMetrics?: boolean;
  minEngagementScore?: number;
}

/**
 * Technical report parameters
 */
export interface TechnicalReportParams extends BaseReportParams {
  includeErrorMetrics?: boolean;
  includePerformanceMetrics?: boolean;
  includeNetworkMetrics?: boolean;
  includeJavaScriptErrors?: boolean;
  minErrorThreshold?: number;
  maxResponseTime?: number;
}

/**
 * Business report parameters
 */
export interface BusinessReportParams extends BaseReportParams {
  includeABTestMetrics?: boolean;
  includeCampaignMetrics?: boolean;
  includeFeatureUsage?: boolean;
  includeGoalCompletion?: boolean;
  includeFunnelMetrics?: boolean;
  businessValueThreshold?: number;
}

/**
 * Mobile report parameters
 */
export interface MobileReportParams extends BaseReportParams {
  includeAppMetrics?: boolean;
  includePushNotificationMetrics?: boolean;
  includeInAppPurchaseMetrics?: boolean;
  includeOrientationMetrics?: boolean;
  appVersions?: string[];
  deviceModels?: string[];
}

/**
 * Custom report parameters
 */
export interface CustomReportParams extends BaseReportParams {
  customEventTypes?: string[];
  customFilters?: Record<string, unknown>;
  customGrouping?: string[];
  customMetrics?: string[];
  customCalculations?: Record<string, string>;
}

/**
 * Summary report parameters
 */
export interface SummaryReportParams extends BaseReportParams {
  includeAllCategories?: boolean;
  includeTrends?: boolean;
  includeComparisons?: boolean;
  comparisonPeriod?: ReportTimeRange;
  includeForecasting?: boolean;
}

/**
 * Trend report parameters
 */
export interface TrendReportParams extends BaseReportParams {
  trendPeriod?: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  includeSeasonality?: boolean;
  includeGrowthRates?: boolean;
  includeAnomalyDetection?: boolean;
  minDataPoints?: number;
}

/**
 * Performance report parameters
 */
export interface PerformanceReportParams extends BaseReportParams {
  includeResponseTimes?: boolean;
  includeThroughput?: boolean;
  includeErrorRates?: boolean;
  includeResourceUsage?: boolean;
  includeDatabaseMetrics?: boolean;
  includeCacheMetrics?: boolean;
  minResponseTime?: number;
  maxErrorRate?: number;
}

/**
 * Geographic report parameters
 */
export interface GeographicReportParams extends BaseReportParams {
  includeCountryBreakdown?: boolean;
  includeRegionBreakdown?: boolean;
  includeCityBreakdown?: boolean;
  includeTimezoneAnalysis?: boolean;
  minEventsPerLocation?: number;
  topLocationsLimit?: number;
}

/**
 * Device report parameters
 */
export interface DeviceReportParams extends BaseReportParams {
  includeDeviceBreakdown?: boolean;
  includeBrowserBreakdown?: boolean;
  includeOSBreakdown?: boolean;
  includeScreenResolution?: boolean;
  includeConnectionType?: boolean;
  minEventsPerDevice?: number;
  topDevicesLimit?: number;
}

/**
 * User journey report parameters
 */
export interface UserJourneyReportParams extends BaseReportParams {
  includePathAnalysis?: boolean;
  includeDropoffPoints?: boolean;
  includeConversionPaths?: boolean;
  includeSessionReplay?: boolean;
  minPathLength?: number;
  maxPathLength?: number;
  includeExitPoints?: boolean;
}

/**
 * Funnel report parameters
 */
export interface FunnelReportParams extends BaseReportParams {
  funnelSteps: string[];
  includeStepMetrics?: boolean;
  includeConversionRates?: boolean;
  includeDropoffAnalysis?: boolean;
  includeTimeToComplete?: boolean;
  includeAbandonmentReasons?: boolean;
  minStepDuration?: number;
  maxStepDuration?: number;
}

/**
 * Conversion report parameters
 */
export interface ConversionReportParams extends BaseReportParams {
  conversionEvents: EventType[];
  includeAttribution?: boolean;
  includeLifetimeValue?: boolean;
  includeRepeatPurchases?: boolean;
  includeUpsells?: boolean;
  includeCrossSells?: boolean;
  minConversionValue?: number;
  maxConversionValue?: number;
}

/**
 * Retention report parameters
 */
export interface RetentionReportParams extends BaseReportParams {
  retentionPeriod?: 'day' | 'week' | 'month' | 'quarter';
  includeCohortAnalysis?: boolean;
  includeChurnAnalysis?: boolean;
  includeLifetimeValue?: boolean;
  includeEngagementScore?: boolean;
  minRetentionRate?: number;
  maxChurnRate?: number;
}

/**
 * Cohort report parameters
 */
export interface CohortReportParams extends BaseReportParams {
  cohortPeriod?: 'day' | 'week' | 'month' | 'quarter';
  includeSizeAnalysis?: boolean;
  includeRetentionAnalysis?: boolean;
  includeRevenueAnalysis?: boolean;
  includeEngagementAnalysis?: boolean;
  minCohortSize?: number;
  maxCohortSize?: number;
}

/**
 * Union type for all report parameters
 */
export type ReportParams = 
  | EngagementReportParams
  | CommerceReportParams
  | DiscoveryReportParams
  | AuthenticationReportParams
  | ContentReportParams
  | SocialReportParams
  | TechnicalReportParams
  | BusinessReportParams
  | MobileReportParams
  | CustomReportParams
  | SummaryReportParams
  | TrendReportParams
  | PerformanceReportParams
  | GeographicReportParams
  | DeviceReportParams
  | UserJourneyReportParams
  | FunnelReportParams
  | ConversionReportParams
  | RetentionReportParams
  | CohortReportParams;

/**
 * Report generation result
 */
export interface ReportResult {
  id: string;
  type: ReportType;
  name: string;
  data: AnalyticsMetrics | Record<string, unknown>;
  metadata: {
    generatedAt: Date;
    generatedBy: string;
    parameters: ReportParams;
    processingTime: number;
    recordCount: number;
    cacheHit?: boolean;
    schemaVersion: string;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

/**
 * Report generation request
 */
export interface ReportGenerationRequest {
  type: ReportType;
  name: string;
  parameters: ReportParams;
  options?: {
    priority?: 'low' | 'normal' | 'high';
    schedule?: Date;
    emailNotification?: boolean;
    format?: 'json' | 'csv' | 'pdf' | 'excel';
    includeCharts?: boolean;
    includeRawData?: boolean;
  };
}

/**
 * Report query parameters for filtering existing reports
 */
export interface ReportQuery {
  types?: ReportType[];
  status?: ('pending' | 'processing' | 'completed' | 'failed')[];
  generatedBy?: string[];
  dateRange?: ReportTimeRange;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'type';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Type guard to check if parameters match a specific report type
 */
export function isReportParams<T extends ReportType>(
  type: T,
  params: ReportParams
): params is Extract<ReportParams, { type?: T }> {
  return (params as { type?: ReportType }).type === type || type === ReportType.CUSTOM;
}

/**
 * Type guard to check if parameters are for engagement report
 */
export function isEngagementReportParams(params: ReportParams): params is EngagementReportParams {
  return 'includeScrollDepth' in params || 'includeHoverEvents' in params;
}

/**
 * Type guard to check if parameters are for commerce report
 */
export function isCommerceReportParams(params: ReportParams): params is CommerceReportParams {
  return 'includeCartAbandonment' in params || 'includePurchaseFlow' in params;
}

/**
 * Type guard to check if parameters are for custom report
 */
export function isCustomReportParams(params: ReportParams): params is CustomReportParams {
  return 'customEventTypes' in params || 'customFilters' in params;
}

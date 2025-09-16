/**
 * Comprehensive analytics metrics interface
 * Used for real-time and historical analytics data
 */
export interface AnalyticsMetrics {
  // Core metrics
  totalEvents: number;
  eventsByType: Record<string, number>;
  uniqueUsers: number;
  uniqueSessions: number;
  averageEventsPerUser: number;

  // Top performers
  topEventTypes: Array<{
    type: string;
    count: number;
  }>;

  // Time-based metrics
  eventsByHour?: Record<string, number>;
  eventsByDay?: Record<string, number>;
  eventsByWeek?: Record<string, number>;

  // Geographic metrics
  eventsByCountry?: Record<string, number>;
  eventsByRegion?: Record<string, number>;
  topCountries?: Array<{
    country: string;
    count: number;
  }>;

  // Device and platform metrics
  eventsByDeviceType?: Record<string, number>;
  eventsByBrowser?: Record<string, number>;
  eventsByOS?: Record<string, number>;

  // User engagement metrics
  sessionDuration?: {
    average: number;
    median: number;
    p95: number;
  };

  bounceRate?: number;
  returnVisitorRate?: number;

  // Business value metrics
  totalBusinessValue: number;
  averageValuePerEvent: number;
  valueByEventType: Record<string, number>;

  // Attribution metrics
  eventsBySource?: Record<string, number>;
  eventsByMedium?: Record<string, number>;
  eventsByCampaign?: Record<string, number>;

  // Performance metrics
  processingTime?: {
    average: number;
    p95: number;
    p99: number;
  };

  errorRate?: number;
  throughput?: number; // events per second

  // Trend analysis
  trends?: {
    growth: 'positive' | 'negative' | 'neutral';
    userEngagement: 'high' | 'medium' | 'low';
    performance: 'improving' | 'degrading' | 'stable';
    conversion: 'increasing' | 'decreasing' | 'stable';
  };

  // Real-time indicators
  lastUpdated: Date;
  isRealtime: boolean;

  // Custom metrics (extensible)
  customMetrics?: Record<string, any>;
}

/**
 * Metrics calculation context
 * Provides additional context for metric calculations
 */
export interface MetricsContext {
  timeRange: {
    start: Date;
    end: Date;
  };
  filters?: {
    eventTypes?: string[];
    userIds?: string[];
    countries?: string[];
    deviceTypes?: string[];
  };
  includeRealtime?: boolean;
  aggregationLevel?: 'hour' | 'day' | 'week' | 'month';
}

/**
 * Metrics query interface
 * Defines parameters for metrics queries
 */
export interface MetricsQuery {
  timeRange?: {
    start: Date;
    end: Date;
  };
  eventTypes?: string[];
  userIds?: string[];
  countries?: string[];
  deviceTypes?: string[];
  sources?: string[];
  groupBy?: ('hour' | 'day' | 'week' | 'month' | 'eventType' | 'country' | 'deviceType')[];
  includeRealtime?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Metrics aggregation result
 * Contains aggregated metrics data
 */
export interface MetricsAggregation {
  groupBy: string;
  groupValue: string;
  metrics: Partial<AnalyticsMetrics>;
  sampleSize: number;
  confidence?: number; // Statistical confidence level
}

/**
 * Real-time metrics update
 * Used for live dashboard updates
 */
export interface RealtimeMetricsUpdate {
  timestamp: Date;
  eventType: string;
  userId: string;
  sessionId: string;
  businessValue?: number;
  metadata?: Record<string, any>;
}

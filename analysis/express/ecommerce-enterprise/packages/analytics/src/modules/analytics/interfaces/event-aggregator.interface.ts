import { EventType } from '../types/event-type.enum';

/**
 * Event Aggregator Interface
 * Defines contract for aggregating and processing analytics events
 */
export interface EventAggregator {
  /**
   * Aggregate events by type within a time window
   * @param eventType The type of events to aggregate
   * @param timeWindow The time range for aggregation
   * @returns Array of events matching the criteria
   */
  aggregateEvents(
    eventType: EventType,
    timeWindow: { start: Date; end: Date },
  ): Promise<any[]>;

  /**
   * Get summary statistics for a specific event type
   * @param eventType The event type to analyze
   * @returns Summary object with key metrics
   */
  getEventSummary(eventType: EventType): Promise<{
    eventType: EventType;
    totalCount: number;
    uniqueUsers: number;
    dateRange: {
      earliest: Date | null;
      latest: Date | null;
    };
    averageFrequency: number;
    peakHour: number;
    businessValue: number;
  }>;

  /**
   * Calculate trend analysis for events
   * @param eventType The event type to analyze
   * @param periods Number of periods to analyze
   * @returns Trend analysis data
   */
  calculateTrend(
    eventType: EventType,
    periods: number,
  ): Promise<{
    trend: 'increasing' | 'decreasing' | 'stable';
    changePercent: number;
    periods: Array<{
      period: string;
      count: number;
      change: number;
    }>;
  }>;

  /**
   * Get user behavior patterns
   * @param userId The user to analyze
   * @param timeWindow Time range for analysis
   * @returns User behavior pattern data
   */
  getUserBehaviorPattern(
    userId: string,
    timeWindow: { start: Date; end: Date },
  ): Promise<{
    userId: string;
    totalEvents: number;
    eventSequence: EventType[];
    sessionCount: number;
    averageSessionDuration: number;
    topEventTypes: EventType[];
    engagementScore: number;
  }>;

  /**
   * Identify anomalies in event patterns
   * @param eventType The event type to monitor
   * @param threshold Anomaly detection threshold
   * @returns Anomalies detected
   */
  detectAnomalies(
    eventType: EventType,
    threshold: number,
  ): Promise<{
    eventType: EventType;
    anomalies: Array<{
      timestamp: Date;
      expectedValue: number;
      actualValue: number;
      deviation: number;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }>;
    overallAnomalyScore: number;
  }>;

  /**
   * Get conversion funnel analysis
   * @param funnelSteps Array of event types representing funnel steps
   * @param timeWindow Time range for analysis
   * @returns Funnel analysis data
   */
  analyzeConversionFunnel(
    funnelSteps: EventType[],
    timeWindow: { start: Date; end: Date },
  ): Promise<{
    funnelSteps: Array<{
      step: EventType;
      users: number;
      conversionRate: number;
      dropOffRate: number;
    }>;
    overallConversionRate: number;
    bottleneckStep: EventType;
    recommendations: string[];
  }>;

  /**
   * Calculate cohort analysis
   * @param cohortDefinition How to define cohorts
   * @param metrics Metrics to calculate for each cohort
   * @param periods Number of periods to track
   * @returns Cohort analysis results
   */
  calculateCohortAnalysis(
    cohortDefinition: {
      eventType: EventType;
      timeGranularity: 'day' | 'week' | 'month';
    },
    metrics: ('retention' | 'revenue' | 'engagement')[],
    periods: number,
  ): Promise<{
    cohorts: Array<{
      cohortId: string;
      cohortSize: number;
      periodMetrics: Record<string, number[]>;
    }>;
    averageRetentionCurve: number[];
    insights: string[];
  }>;
}

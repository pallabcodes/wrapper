import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { db } from '../../../database/connection';
import { analyticsEvents } from '../../../database/schema/analytics';
import { CreateAnalyticsEventDto, EventType } from '../dto/create-analytics-event.dto';
import { eq, desc, count, and, gte, lte } from 'drizzle-orm';

// Temporarily define AnalyticsQueryDto inline to fix import issues
interface AnalyticsQueryDto {
  eventType?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

// Types and Interfaces
import { AnalyticsMetrics } from '../interfaces/analytics-metrics.interface';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  constructor() {}

  // ============================================================================
  // MAIN BUSINESS METHODS (OOP + FP Hybrid)
  // ============================================================================

  /**
   * Track an analytics event with validation
   * Enterprise-grade event tracking with comprehensive logging
   */
  async trackEvent(dto: CreateAnalyticsEventDto): Promise<{ success: boolean; data: unknown; timestamp: Date }> {
    this.logger.debug('Tracking analytics event', { eventType: dto.eventType });

    // Validate input
    this.validateEventData(dto);

    // Create event data for Drizzle
    const eventData = {
      eventType: dto.eventType as EventType,
      userId: dto.userId,
      timestamp: dto.timestamp ? new Date(dto.timestamp) : new Date(),
      metadata: dto.metadata ? JSON.stringify(dto.metadata) : null,
      sessionId: dto.sessionId || this.generateSessionId(),
      location: dto.location ? JSON.stringify(dto.location) : null,
      device: dto.device ? JSON.stringify(dto.device) : null,
      attribution: dto.attribution ? JSON.stringify(dto.attribution) : null,
      tags: dto.tags ? JSON.stringify(dto.tags) : null,
      ipAddress: dto.ipAddress || null,
      userAgent: dto.userAgent || null,
      country: dto.country || null,
      deviceType: dto.deviceType || null,
      source: dto.source || null,
      businessValue: dto.businessValue?.toString() || '0',
      isRealtime: dto.isRealtime || false,
      processingStatus: 'pending' as const,
      processingAttempts: 0,
    };

    const result = await db.insert(analyticsEvents).values(eventData).returning();
    const savedEvent = result[0];

    this.logger.log('Event tracked successfully', {
      eventId: savedEvent?.id,
      eventType: savedEvent?.eventType
    });

    return {
      success: true,
      data: savedEvent,
      timestamp: new Date(),
    };
  }

  /**
   * Query analytics data with advanced filtering
   * Enterprise-grade querying with comprehensive logging
   */
  async queryAnalytics(query: AnalyticsQueryDto): Promise<{ success: boolean; data: { events: unknown[]; aggregations: Record<string, unknown>; total: number; page: number; limit: number }; timestamp: Date }> {
    this.logger.debug('Querying analytics data', { query });

    // Build where conditions
    const whereConditions = [];
    
    if (query.eventType) {
      whereConditions.push(eq(analyticsEvents.eventType, query.eventType as EventType));
    }

    if (query.userId) {
      whereConditions.push(eq(analyticsEvents.userId, query.userId));
    }

    if (query.startDate && query.endDate) {
      whereConditions.push(
        and(
          gte(analyticsEvents.timestamp, new Date(query.startDate)),
          lte(analyticsEvents.timestamp, new Date(query.endDate))
        )
      );
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Apply sorting
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
    const orderBy = sortOrder === 'desc' ? desc(analyticsEvents.timestamp) : analyticsEvents.timestamp;

    // Apply pagination
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    // Get events and total count
    const [events, totalResult] = await Promise.all([
      db.select().from(analyticsEvents)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(analyticsEvents).where(whereClause)
    ]);

    const total = totalResult[0]?.count || 0;

    // Calculate basic aggregations
    const aggregations = {
      totalEvents: total,
      uniqueUsers: new Set(events.map(e => e.userId)).size,
      eventTypes: events.reduce((acc: Record<string, number>, event) => {
        const eventType = event.eventType as string;
        acc[eventType] = (acc[eventType] || 0) + 1;
        return acc;
      }, {}),
    };

    return {
      success: true,
      data: {
        events: events.map(e => this.toPlainObject(e)),
        aggregations,
        total,
        page,
        limit,
      },
      timestamp: new Date(),
    };
  }

  /**
   * Get real-time metrics
   * Enterprise-grade metrics calculation
   */
  async getRealtimeMetrics(timeRange: string = '1h'): Promise<{ success: boolean; data: AnalyticsMetrics; timestamp: Date }> {
    const timeWindow = this.parseTimeRange(timeRange);
    
    // Example: batch by eventType to reduce duplicate queries in a tick
    // Example of using repository loader elsewhere as needed

    const events = await db.select()
      .from(analyticsEvents)
      .where(
        and(
          gte(analyticsEvents.timestamp, timeWindow.start),
          lte(analyticsEvents.timestamp, timeWindow.end)
        )
      );

    const metrics: AnalyticsMetrics = {
      totalEvents: events.length,
      eventsByType: {},
      uniqueUsers: new Set(events.map(e => e.userId)).size,
      uniqueSessions: new Set(events.map(e => e.sessionId)).size,
      averageEventsPerUser: 0,
      topEventTypes: [],
      totalBusinessValue: 0,
      averageValuePerEvent: 0,
      valueByEventType: {},
      lastUpdated: new Date(),
      isRealtime: true,
    };

    // Calculate events by type
    events.forEach(event => {
      const eventType = event.eventType as string;
      metrics.eventsByType[eventType] =
        (metrics.eventsByType[eventType] || 0) + 1;
    });

    metrics.averageEventsPerUser = metrics.totalEvents / metrics.uniqueUsers;

    metrics.topEventTypes = Object.entries(metrics.eventsByType)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    return { success: true, data: metrics, timestamp: new Date() };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private toPlainObject(event: Record<string, unknown>): Record<string, unknown> {
    return {
      ...event,
      metadata: event.metadata ? JSON.parse(event.metadata) : null,
      location: event.location ? JSON.parse(event.location) : null,
      device: event.device ? JSON.parse(event.device) : null,
      attribution: event.attribution ? JSON.parse(event.attribution) : null,
      tags: event.tags ? JSON.parse(event.tags) : null,
    };
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private parseTimeRange(range: string): { start: Date; end: Date } {
    const now = new Date();
    const match = range.match(/^(\d+)([smhd])$/);

    if (!match) {
      return {
        start: new Date(now.getTime() - 3600000), // 1 hour ago
        end: now
      };
    }

    const value = parseInt(match[1]!, 10);
    const unit = match[2]!;

    const multipliers: Record<string, number> = {
      s: 1000,           // seconds
      m: 60000,          // minutes
      h: 3600000,        // hours
      d: 86400000,       // days
    };

    const multiplier = multipliers[unit];
    if (!multiplier) {
      return {
        start: new Date(now.getTime() - 3600000),
        end: now
      };
    }

    return {
      start: new Date(now.getTime() - (value * multiplier)),
      end: now
    };
  }

  private validateEventData(dto: CreateAnalyticsEventDto): void {
    if (!dto.eventType || !dto.userId) {
      throw new BadRequestException('eventType and userId are required');
    }
  }

  // ============================================================================
  // ADDITIONAL BUSINESS METHODS
  // ============================================================================

  async aggregateEvents(
    eventType: EventType,
    timeWindow: { start: Date; end: Date },
  ): Promise<Record<string, unknown>[]> {
    return await db.select()
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.eventType, eventType),
          gte(analyticsEvents.timestamp, timeWindow.start),
          lte(analyticsEvents.timestamp, timeWindow.end)
        )
      );
  }

  async getEventSummary(eventType: EventType): Promise<{ eventType: EventType; totalCount: number; uniqueUsers: number; dateRange: { earliest: Date | null; latest: Date | null } }> {
    const events = await db.select()
      .from(analyticsEvents)
      .where(eq(analyticsEvents.eventType, eventType));

    const uniqueUsers = new Set(events.map(e => e.userId)).size;
    const timestamps = events.map(e => e.timestamp.getTime());

    return {
      eventType,
      totalCount: events.length,
      uniqueUsers,
      dateRange: {
        earliest: events.length > 0 ? new Date(Math.min(...timestamps)) : null,
        latest: events.length > 0 ? new Date(Math.max(...timestamps)) : null,
      },
    };
  }
}
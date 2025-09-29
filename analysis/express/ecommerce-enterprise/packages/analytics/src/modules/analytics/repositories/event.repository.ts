import { Inject, Injectable } from '@nestjs/common';
import { BatchingService } from '../shared/db/batching.module';
import { db } from '../../../database/connection';
import { analyticsEvents } from '../../../database/schema/analytics';
import { eq } from 'drizzle-orm';

interface AnalyticsEvent {
  id: string;
  eventType: string;
  userId: string;
  sessionId?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  device?: {
    type?: 'desktop' | 'mobile' | 'tablet';
    os?: string;
    browser?: string;
    version?: string;
    screenResolution?: string;
  };
  attribution?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  tags?: string[];
  country?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  source?: string;
  businessValue?: number;
  isRealtime?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class EventRepository {
  private byTypeLoader;

  constructor(@Inject(BatchingService) batching: BatchingService) {
    this.byTypeLoader = batching.getOrCreateLoader<string, AnalyticsEvent[]>('eventsByType', async (types: readonly string[]) => {
      const map = new Map<string, AnalyticsEvent[]>();
      // naive per-type fetch; swap with IN queries or UNION in real DB
      for (const t of types) {
        const rows = await db.select().from(analyticsEvents).where(eq(analyticsEvents.eventType, t));
        map.set(t, rows as AnalyticsEvent[]);
      }
      return types.map((t: string) => map.get(t) || []);
    });
  }

  loadByEventType(eventType: string): Promise<AnalyticsEvent[]> {
    return this.byTypeLoader.load(eventType);
  }
}



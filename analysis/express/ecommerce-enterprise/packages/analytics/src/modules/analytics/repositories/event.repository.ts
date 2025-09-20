import { Inject, Injectable } from '@nestjs/common';
import { BatchingService } from '../shared/db/batching.module';
import { db } from '../../../database/connection';
import { analyticsEvents } from '../../../database/schema/analytics';
import { eq } from 'drizzle-orm';

@Injectable()
export class EventRepository {
  private byTypeLoader;

  constructor(@Inject(BatchingService) batching: BatchingService) {
    this.byTypeLoader = batching.getOrCreateLoader<string, any[]>('eventsByType', async (types: readonly string[]) => {
      const map = new Map<string, any[]>();
      // naive per-type fetch; swap with IN queries or UNION in real DB
      for (const t of types) {
        const rows = await db.select().from(analyticsEvents).where(eq(analyticsEvents.eventType, t as any));
        map.set(t as string, rows);
      }
      return types.map((t: string) => map.get(t) || []);
    });
  }

  loadByEventType(eventType: string): Promise<any[]> {
    return this.byTypeLoader.load(eventType);
  }
}



import { EventType } from '../types/event-type.enum';

export class AnalyticsQueryDto {
  eventType?: EventType;
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;

  getDateRange(): { start: Date; end: Date } | undefined {
    if (this.startDate && this.endDate) {
      return {
        start: new Date(this.startDate),
        end: new Date(this.endDate),
      };
    }
    return undefined;
  }
}
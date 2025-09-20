import { Injectable } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Injectable()
export class BusinessMetricsService {
  constructor(private readonly metrics: MetricsService) {}

  recordEventIngested(kind: string): void {
    this.metrics.increment('biz.events.ingested.total');
    this.metrics.increment(`biz.events.ingested.kind.${this.sanitize(kind)}`);
    this.metrics.recordRate('biz.events.ingested.rate');
  }

  recordEventQuery(): void {
    this.metrics.increment('biz.events.queries.total');
    this.metrics.recordRate('biz.events.queries.rate');
  }

  recordActiveUser(userId: string): void {
    this.metrics.increment('biz.users.active.total');
    this.metrics.increment(`biz.users.active.id.${this.sanitize(userId)}`);
  }

  private sanitize(s: string): string {
    return s.replace(/[^a-zA-Z0-9:_-]/g, '_').slice(0, 80);
  }
}



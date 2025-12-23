import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EventTrackingService {
  private readonly logger = new Logger(EventTrackingService.name);

  async trackEvent(event: Record<string, unknown>) {
    this.logger.log('Tracking event', { event });
    return { message: 'Event tracking not implemented yet' };
  }
}

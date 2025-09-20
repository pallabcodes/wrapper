import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EventStreamingService } from '../services/event-streaming.service';
import { EVENT_STREAMING_METADATA, EventStreamingMetadata } from '../decorators/event-streaming.decorator';

@Injectable()
export class EventStreamingGuard implements CanActivate {
  private readonly logger = new Logger(EventStreamingGuard.name);

  constructor(
    private reflector: Reflector,
    private eventStreamingService: EventStreamingService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.get<EventStreamingMetadata>(
      EVENT_STREAMING_METADATA,
      context.getHandler(),
    );

    if (!metadata) {
      return true;
    }

    try {
      // Check if event streaming service is healthy
      const health = await this.eventStreamingService.getHealth();
      
      if (health.status === 'unhealthy') {
        this.logger.warn('Event streaming service is unhealthy, blocking request');
        return false;
      }

      // Additional validation logic can be added here
      return true;
    } catch (error) {
      this.logger.error('Error in EventStreamingGuard:', error);
      return false;
    }
  }
}

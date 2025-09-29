import { Controller, Get, Post, Body, Logger } from '@nestjs/common';

// Services
import { AnalyticsService } from '../services/analytics.service';

// Types
import { CreateAnalyticsEventDto } from '../dto/create-analytics-event.dto';

@Controller('events')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post()
  async trackEvent(@Body() dto: CreateAnalyticsEventDto) {
    this.logger.debug('Tracking analytics event', { eventType: dto.eventType });

    const result = await this.analyticsService.trackEvent(dto);

    this.logger.log('Event tracked successfully', {
      eventType: dto.eventType,
    });

    return result;
  }

  @Get()
  async getEvents() {
    this.logger.debug('Getting analytics events');

    const result = await this.analyticsService.queryAnalytics({} as Record<string, unknown>);

    this.logger.log('Events retrieved successfully');

    return result;
  }

  @Get('health')
  async health() {
    return {
      status: 'healthy',
      service: 'analytics-microservice',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}

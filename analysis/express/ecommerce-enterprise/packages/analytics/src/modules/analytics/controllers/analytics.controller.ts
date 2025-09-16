import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { Auth, Policies } from '@ecommerce-enterprise/authx';
import { RateLimit } from '../shared/decorators/rate-limit.decorator';

// Services
import { AnalyticsService } from '../services/analytics.service';

// Types
// import { EventType } from '../types/event-type.enum'; // Temporarily commented out

@Controller()
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  @Auth()
  @Post('events')
  async trackEvent(@Body() dto: any) {
    this.logger.debug('Tracking analytics event', { eventType: dto.eventType });

    const result = await this.analyticsService.trackEvent(dto);

    this.logger.log('Event tracked successfully', {
      eventType: dto.eventType,
    });

    return result;
  }

  @Auth()
  @Policies((p) => (p.roles || []).includes('admin'))
  @RateLimit(60)
  @Get('events')
  async getEvents() {
    this.logger.debug('Getting analytics events');

    const result = await this.analyticsService.queryAnalytics({} as any);

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

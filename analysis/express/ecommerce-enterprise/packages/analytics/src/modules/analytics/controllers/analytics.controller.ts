import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { Auth, Policies, RequirePermissions, RelationCheck } from '@ecommerce-enterprise/authx';
import { RateLimitByUser, RateLimitStrict } from '../shared/rate-limit/rate-limit.decorator';
import { Cache } from '../shared/cache/cache.decorator';
import { Serialize } from '../shared/serialization/fast-stringify.interceptor';
import { Resilience } from '../shared/resilience/resilience.decorator';
import { V1, V2 } from '../shared/versioning/versioning.decorator';
import { Validate, StringField, NumberField, ObjectField } from '../shared/validation/validation.decorator';
import { CreateAnalyticsEventDto } from '../dto/create-analytics-event.dto';

// Services
import { AnalyticsService } from '../services/analytics.service';
import { BusinessMetricsService } from '../shared/monitoring/business-metrics.service';

// Types
// import { EventType } from '../types/event-type.enum'; // Temporarily commented out

@Controller()
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly businessMetrics: BusinessMetricsService,
  ) {}

  @Auth()
  @V1()
  @RateLimitByUser(100, 60000)
  @Validate({
    eventType: StringField({ required: true, min: 1, max: 100 }),
    userId: StringField({ required: true }),
    metadata: ObjectField({}, { required: false }),
    timestamp: NumberField({ required: false }),
  })
  @RequirePermissions('events:write')
  @Post('events')
  async trackEvent(@Body() dto: CreateAnalyticsEventDto) {
    this.logger.debug('Tracking analytics event', { eventType: dto.eventType });

    const result = await this.analyticsService.trackEvent(dto);

    // Business KPI metrics
    if (dto?.eventType) {
      this.businessMetrics.recordEventIngested(String(dto.eventType));
    }
    if (dto?.userId) {
      this.businessMetrics.recordActiveUser(dto.userId);
    }

    this.logger.log('Event tracked successfully', {
      eventType: dto.eventType,
    });

    return result;
  }

  @Auth()
  @Policies((p) => (p.roles || []).includes('admin'))
  @V2()
  @RateLimitStrict(10, 60000)
  @Cache({ ttlMs: 5_000, swrMs: 25_000, key: ({ query }) => `events:${JSON.stringify(query || {})}` })
  @Serialize({
    title: 'EventsResponse',
    type: 'object',
    properties: {
      data: { type: 'array', items: { type: 'object', additionalProperties: true } },
      count: { type: 'number' },
    },
    required: ['data', 'count'],
  } as Record<string, unknown>)
  @Resilience({ enabled: true, failureRateThreshold: 0.5, windowMs: 30000, openDurationMs: 20000, halfOpenMaxCalls: 5 })
  @RequirePermissions('events:read')
  @RelationCheck({ relation: 'viewer', objectParam: 'projectId' })
  @Get('projects/:projectId/events')
  async getEvents() {
    this.logger.debug('Getting analytics events');

    const result = await this.analyticsService.queryAnalytics({} as Record<string, unknown>);

    // Business KPI metrics
    this.businessMetrics.recordEventQuery();

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

import { Controller, Get, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { SimpleEventDemoService } from './simple-event-demo.service';

@Controller('event-streaming-demo')
export class EventStreamingDemoController {
  constructor(private simpleEventDemoService: SimpleEventDemoService) {}

  @Get('health')
  async getHealth() {
    return this.simpleEventDemoService.getHealth();
  }

  @Get('metrics')
  async getMetrics() {
    return this.simpleEventDemoService.getMetrics();
  }

  @Get('events')
  async getEvents() {
    const events = await this.simpleEventDemoService.getEvents();
    return {
      success: true,
      results: { events },
      message: 'Events retrieved successfully',
    };
  }

  @Post('users')
  @HttpCode(HttpStatus.OK)
  async demonstrateUserEvents() {
    return this.simpleEventDemoService.demonstrateUserEvents();
  }

  @Post('orders')
  @HttpCode(HttpStatus.OK)
  async demonstrateOrderEvents() {
    return this.simpleEventDemoService.demonstrateOrderEvents();
  }

  @Post('payments')
  @HttpCode(HttpStatus.OK)
  async demonstratePaymentEvents() {
    return this.simpleEventDemoService.demonstratePaymentEvents();
  }

  @Post('inventory')
  @HttpCode(HttpStatus.OK)
  async demonstrateInventoryEvents() {
    return this.simpleEventDemoService.demonstrateInventoryEvents();
  }

  @Post('batch')
  @HttpCode(HttpStatus.OK)
  async demonstrateBatchPublishing() {
    return this.simpleEventDemoService.demonstrateBatchPublishing();
  }

  @Post('multi-topic')
  @HttpCode(HttpStatus.OK)
  async demonstrateMultiTopicPublishing() {
    return this.simpleEventDemoService.demonstrateMultiTopicPublishing();
  }

  @Post('load-test')
  @HttpCode(HttpStatus.OK)
  async simulateEventProcessingLoad() {
    return this.simpleEventDemoService.simulateEventProcessingLoad();
  }
}

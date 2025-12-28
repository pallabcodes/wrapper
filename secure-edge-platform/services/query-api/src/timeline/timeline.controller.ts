import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { TimelineService } from './timeline.service';

@Controller('timeline')
export class TimelineController {
    constructor(private readonly timelineService: TimelineService) { }

    @Get()
    async getTimeline(
        @Query('source_id') sourceId: string,
        @Query('start') start: string,
        @Query('end') end: string,
    ) {
        return this.timelineService.getEvents(sourceId, start, end);
    }

    @Get('alerts')
    async getAlerts(@Query('since') since: string) {
        return this.timelineService.getAlerts(since);
    }
}

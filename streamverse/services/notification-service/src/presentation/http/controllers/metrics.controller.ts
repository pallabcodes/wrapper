import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { MetricsService } from '@streamverse/common';

/**
 * Metrics Controller
 *
 * Exposes Prometheus metrics endpoint for scraping
 */
@Controller('metrics')
export class MetricsController {
    constructor(private readonly metricsService: MetricsService) { }

    @Get()
    async getMetrics(@Res() res: Response): Promise<void> {
        const metrics = await this.metricsService.getMetrics();
        res.set('Content-Type', 'text/plain');
        res.send(metrics);
    }
}

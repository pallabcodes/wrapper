import { Injectable } from '@nestjs/common';
import { Counter } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { IMetricsService } from '../../../core/ports/metrics.port';

@Injectable()
export class PrometheusMetricsAdapter implements IMetricsService {
    constructor(
        @InjectMetric('rate_limit_checks_total') public checksCounter: Counter<string>,
    ) { }

    // this is for monitoring the rate limit checks
    incrementCheck(clientId: string, status: 'allowed' | 'blocked'): void {
        this.checksCounter.labels(clientId, status).inc();
        // Increments: rate_limit_checks_total{client_id="user123",status="allowed"} +1
    }
}

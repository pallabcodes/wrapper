import { Injectable } from '@nestjs/common';
import { Counter } from 'prom-client';
import { IMetricsService } from '@domain/ports/metrics-service.port';

/**
 * Infrastructure Adapter: Prometheus Metrics
 * 
 * Implements IMetricsService port
 * (In Hexagonal: adapters/outbound/prometheus/prometheus-metrics.adapter.ts)
 */
@Injectable()
export class PrometheusMetricsAdapter implements IMetricsService {
    private readonly checkCounter: Counter<string>;

    constructor() {
        this.checkCounter = new Counter({
            name: 'rate_limit_checks_total',
            help: 'Total number of rate limit checks',
            labelNames: ['client_id', 'status'],
        });
    }

    incrementCheck(clientId: string, status: 'allowed' | 'blocked'): void {
        this.checkCounter.inc({ client_id: clientId, status });
    }
}

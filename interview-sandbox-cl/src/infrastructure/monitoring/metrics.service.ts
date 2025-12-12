import { Injectable } from '@nestjs/common';
import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

type MetricsLabels = { method: string; route: string; status: string };

@Injectable()
export class MetricsService {
  private readonly registry: Registry;
  private readonly enabled: boolean;
  private readonly requestCounter: Counter<string>;
  private readonly errorCounter: Counter<string>;
  private readonly latencyHistogram: Histogram<string>;
  private readonly memoryGauge: Gauge<string>;

  constructor() {
    const bucketsEnv = process.env.METRICS_BUCKETS_MS || '';
    const parsedBuckets = bucketsEnv
      .split(',')
      .map((value) => Number(value.trim()))
      .filter((value) => !Number.isNaN(value) && value > 0);
    const buckets = parsedBuckets.length > 0 ? parsedBuckets : [5, 10, 50, 100, 250, 500, 1000, 2000];

    this.enabled = process.env.METRICS_ENABLED !== 'false';
    this.registry = new Registry();
    collectDefaultMetrics({ register: this.registry });

    this.requestCounter = new Counter({
      name: 'http_requests_total',
      help: 'Total HTTP requests',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry],
    });

    this.errorCounter = new Counter({
      name: 'http_requests_errors_total',
      help: 'Total HTTP requests that resulted in error responses',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry],
    });

    this.latencyHistogram = new Histogram({
      name: 'http_request_duration_ms',
      help: 'HTTP request duration in milliseconds',
      labelNames: ['method', 'route', 'status'],
      buckets,
      registers: [this.registry],
    });

    this.memoryGauge = new Gauge({
      name: 'process_heap_used_bytes',
      help: 'Process heap used in bytes',
      registers: [this.registry],
    });
  }

  startTimer(): () => number {
    const start = Date.now();
    return () => Date.now() - start;
  }

  recordRequest(durationMs: number, labels: MetricsLabels) {
    if (!this.enabled) {
      return;
    }
    this.requestCounter.inc(labels);
    this.latencyHistogram.observe(labels, durationMs);

    const statusCode = Number(labels.status);
    if (statusCode >= 400) {
      this.errorCounter.inc(labels);
    }

    const heapUsed = process.memoryUsage().heapUsed;
    this.memoryGauge.set(heapUsed);
  }

  async asPrometheus(): Promise<string> {
    return this.registry.metrics();
  }
}

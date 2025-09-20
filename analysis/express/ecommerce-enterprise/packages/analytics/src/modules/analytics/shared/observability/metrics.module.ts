import { Global, Module } from '@nestjs/common';
// Fallback ambient types if prom-client types are missing
// eslint-disable-next-line @typescript-eslint/no-var-requires
const prom = require('prom-client');
const collectDefaultMetrics: any = prom.collectDefaultMetrics;
// type Counter = any;
// type Histogram = any;

export const METRICS_REGISTRY = Symbol('METRICS_REGISTRY');
export const HTTP_REQUESTS_TOTAL = Symbol('HTTP_REQUESTS_TOTAL');
export const HTTP_REQUEST_DURATION = Symbol('HTTP_REQUEST_DURATION');

@Global()
@Module({
  providers: [
    {
      provide: METRICS_REGISTRY,
      useFactory: () => {
        const registry = new prom.Registry();
        collectDefaultMetrics({ register: registry });
        return registry;
      },
    },
    {
      provide: HTTP_REQUESTS_TOTAL,
      useFactory: (registry: any) =>
        new prom.Counter({
          name: 'http_requests_total',
          help: 'Total number of HTTP requests',
          labelNames: ['method', 'route', 'status'] as const,
          registers: [registry],
        }),
      inject: [METRICS_REGISTRY],
    },
    {
      provide: HTTP_REQUEST_DURATION,
      useFactory: (registry: any) =>
        new prom.Histogram({
          name: 'http_request_duration_ms',
          help: 'HTTP request duration in ms',
          buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500],
          labelNames: ['method', 'route', 'status'] as const,
          registers: [registry],
        }),
      inject: [METRICS_REGISTRY],
    },
  ],
  exports: [METRICS_REGISTRY, HTTP_REQUESTS_TOTAL, HTTP_REQUEST_DURATION],
})
export class MetricsModule {}



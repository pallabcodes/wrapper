/**
 * App Module - Root module
 *
 * Wires together all controllers and providers.
 */
import { Module } from '@nestjs/common';
import { HealthController } from './adapters/inbound/health.controller';
import { RateLimitController } from './adapters/inbound/rate-limit.controller';
import { GrpcRateLimitController } from './adapters/inbound/grpc.controller';
import { RateLimitService } from './core/services/rate-limit.service';

// concrete redis implementation
import { RedisStorageAdapter } from './adapters/outbound/redis/redis-storage.adapter';
// token for dependency injection
import { STORAGE_PROVIDER } from './core/ports/rate-limit-storage.port';

import { KafkaAuditAdapter } from './adapters/outbound/kafka/kafka-audit.adapter';
import { AUDIT_PROVIDER } from './core/ports/audit.port';

import { PrometheusMetricsAdapter } from './adapters/outbound/prometheus/prometheus-metrics.adapter';
import { METRICS_PROVIDER } from './core/ports/metrics.port';
import { PrometheusModule, makeCounterProvider } from '@willsoto/nestjs-prometheus';

/**
 * Redis for storing cookie counts
 * Kafka for logging cookie consumption
 * Prometheus for monitoring cookie usage
 * */ 
@Module({
    imports: [
        PrometheusModule.register({
            path: '/metrics',
            defaultMetrics: {
                enabled: true,
            },
        }),
    ],
    controllers: [HealthController, RateLimitController, GrpcRateLimitController],
    providers: [
        RateLimitService,
        makeCounterProvider({
            name: 'rate_limit_checks_total',
            help: 'Total number of rate limit checks',
            labelNames: ['client_id', 'status'],
        }),
        {
            provide: STORAGE_PROVIDER,
            useClass: RedisStorageAdapter,
        },
        {
            provide: AUDIT_PROVIDER,
            useClass: KafkaAuditAdapter,
        },
        {
            provide: METRICS_PROVIDER,
            useClass: PrometheusMetricsAdapter,
        },
    ],
})
export class AppModule { }

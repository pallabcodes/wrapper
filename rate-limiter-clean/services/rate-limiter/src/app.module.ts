import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { CustomValidationPipe } from './infrastructure/config/validation.pipe';

// Domain Ports
import { RATE_LIMIT_REPOSITORY } from './domain/ports/rate-limit-repository.port';
import { METRICS_SERVICE } from './domain/ports/metrics-service.port';
import { AUDIT_PUBLISHER } from './domain/ports/audit-publisher.port';

// Infrastructure Adapters (Implementations)
import { RedisRateLimitRepository } from './infrastructure/persistence/redis-repository.adapter';
import { KafkaAuditPublisher } from './infrastructure/messaging/kafka-publisher.adapter';
import { PrometheusMetricsAdapter } from './infrastructure/observability/prometheus-metrics.adapter';

// Application Use Cases
import { CheckRateLimitUseCase } from './application/use-cases/check-rate-limit.usecase';

// Presentation Controllers
import { RateLimitController } from './presentation/http/controllers/rate-limit.controller';

/**
 * App Module
 * 
 * This is where we wire Ports → Adapters
 * 
 * Clean Architecture Dependency Injection:
 * - Use Cases depend on Ports (interfaces)
 * - We inject Adapters (implementations) that implement those Ports
 */
@Module({
    imports: [
        PrometheusModule.register(), // Enable Prometheus metrics endpoint
    ],
    controllers: [
        RateLimitController, // Presentation Layer (Inbound Adapter)
    ],
    providers: [
        // Application Layer
        CheckRateLimitUseCase,

        // Infrastructure Layer: Wire Ports → Adapters
        {
            provide: RATE_LIMIT_REPOSITORY,
            useClass: RedisRateLimitRepository, // Outbound Adapter
        },
        {
            provide: METRICS_SERVICE,
            useClass: PrometheusMetricsAdapter, // Outbound Adapter
        },
        {
            provide: AUDIT_PUBLISHER,
            useClass: KafkaAuditPublisher, // Outbound Adapter
        },

        // Global validation pipe - THIS ENABLES DTO VALIDATION (which defined within presentation layer)
        // Once again, Below sets up a global validation pipe that automatically validates all DTOs used in controllers.
        {
            provide: APP_PIPE,
            useClass: CustomValidationPipe,
        },
    ],
})
export class AppModule { }

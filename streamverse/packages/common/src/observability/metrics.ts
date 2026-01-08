import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import { Injectable } from '@nestjs/common';

/**
 * Global Prometheus registry
 */
export const metricsRegistry = new Registry();

// Collect default Node.js metrics (memory, CPU, event loop, etc.)
collectDefaultMetrics({ register: metricsRegistry });

/**
 * HTTP Request metrics
 */
export const httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'path', 'status_code'],
    registers: [metricsRegistry],
});

export const httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'path', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
    registers: [metricsRegistry],
});

/**
 * Business metrics - Payments
 */
export const paymentsTotal = new Counter({
    name: 'payments_total',
    help: 'Total number of payment attempts',
    labelNames: ['provider', 'status', 'currency'],
    registers: [metricsRegistry],
});

export const paymentAmount = new Histogram({
    name: 'payment_amount_cents',
    help: 'Distribution of payment amounts in cents',
    labelNames: ['provider', 'currency'],
    buckets: [100, 500, 1000, 5000, 10000, 50000, 100000, 500000],
    registers: [metricsRegistry],
});

/**
 * Business metrics - Notifications
 */
export const notificationsTotal = new Counter({
    name: 'notifications_total',
    help: 'Total number of notifications sent',
    labelNames: ['channel', 'type', 'status'],
    registers: [metricsRegistry],
});

export const notificationDeliveryTime = new Histogram({
    name: 'notification_delivery_seconds',
    help: 'Time to deliver notifications in seconds',
    labelNames: ['channel', 'type'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
    registers: [metricsRegistry],
});

/**
 * Circuit breaker metrics
 */
export const circuitBreakerState = new Gauge({
    name: 'circuit_breaker_state',
    help: 'Current state of circuit breakers (0=closed, 1=open, 2=half-open)',
    labelNames: ['name'],
    registers: [metricsRegistry],
});

export const circuitBreakerFailures = new Counter({
    name: 'circuit_breaker_failures_total',
    help: 'Total circuit breaker failures',
    labelNames: ['name'],
    registers: [metricsRegistry],
});

/**
 * Kafka metrics
 */
export const kafkaMessagesProduced = new Counter({
    name: 'kafka_messages_produced_total',
    help: 'Total Kafka messages produced',
    labelNames: ['topic'],
    registers: [metricsRegistry],
});

export const kafkaMessagesConsumed = new Counter({
    name: 'kafka_messages_consumed_total',
    help: 'Total Kafka messages consumed',
    labelNames: ['topic', 'consumer_group'],
    registers: [metricsRegistry],
});

export const kafkaConsumerLag = new Gauge({
    name: 'kafka_consumer_lag',
    help: 'Kafka consumer lag',
    labelNames: ['topic', 'partition', 'consumer_group'],
    registers: [metricsRegistry],
});

/**
 * Metrics Service for NestJS integration
 */
@Injectable()
export class MetricsService {
    /**
     * Record an HTTP request
     */
    recordHttpRequest(
        method: string,
        path: string,
        statusCode: number,
        durationSeconds: number,
    ): void {
        httpRequestsTotal.inc({ method, path, status_code: statusCode.toString() });
        httpRequestDuration.observe(
            { method, path, status_code: statusCode.toString() },
            durationSeconds,
        );
    }

    /**
     * Record a payment attempt
     */
    recordPayment(
        provider: string,
        status: 'success' | 'failure',
        currency: string,
        amountCents?: number,
    ): void {
        paymentsTotal.inc({ provider, status, currency });
        if (amountCents !== undefined) {
            paymentAmount.observe({ provider, currency }, amountCents);
        }
    }

    /**
     * Record a notification
     */
    recordNotification(
        channel: 'email' | 'sms' | 'push',
        type: string,
        status: 'sent' | 'delivered' | 'failed',
        deliveryTimeSeconds?: number,
    ): void {
        notificationsTotal.inc({ channel, type, status });
        if (deliveryTimeSeconds !== undefined) {
            notificationDeliveryTime.observe({ channel, type }, deliveryTimeSeconds);
        }
    }

    /**
     * Update circuit breaker state
     */
    updateCircuitBreakerState(
        name: string,
        state: 'closed' | 'open' | 'half-open',
    ): void {
        const stateValue = { closed: 0, open: 1, 'half-open': 2 }[state];
        circuitBreakerState.set({ name }, stateValue);
    }

    /**
     * Record circuit breaker failure
     */
    recordCircuitBreakerFailure(name: string): void {
        circuitBreakerFailures.inc({ name });
    }

    /**
     * Get all metrics as Prometheus format string
     */
    async getMetrics(): Promise<string> {
        return metricsRegistry.metrics();
    }
}

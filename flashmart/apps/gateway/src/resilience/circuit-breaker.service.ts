import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import CircuitBreaker from 'opossum';
import { Counter, Histogram, Gauge, Registry } from 'prom-client';

export interface CircuitBreakerConfig {
    timeout: number;           // Request timeout
    errorThresholdPercentage: number;  // % of errors to trip
    resetTimeout: number;      // Time before retry after trip
    volumeThreshold: number;   // Min requests before tripping
}

interface ServiceCircuit {
    breaker: CircuitBreaker;
    name: string;
}

@Injectable()
export class CircuitBreakerService {
    private readonly circuits = new Map<string, ServiceCircuit>();
    private readonly registry: Registry;

    // Metrics
    private readonly circuitState: Gauge;
    private readonly requestsTotal: Counter;
    private readonly requestDuration: Histogram;
    private readonly failuresTotal: Counter;

    private readonly defaultConfig: CircuitBreakerConfig = {
        timeout: 5000,
        errorThresholdPercentage: 50,
        resetTimeout: 30000,
        volumeThreshold: 10,
    };

    constructor() {
        this.registry = new Registry();

        this.circuitState = new Gauge({
            name: 'circuit_breaker_state',
            help: 'Circuit breaker state (0=closed, 1=open, 2=half-open)',
            labelNames: ['service'],
            registers: [this.registry],
        });

        this.requestsTotal = new Counter({
            name: 'gateway_requests_total',
            help: 'Total gateway requests',
            labelNames: ['service', 'method', 'status'],
            registers: [this.registry],
        });

        this.requestDuration = new Histogram({
            name: 'gateway_request_duration_seconds',
            help: 'Request duration in seconds',
            labelNames: ['service', 'method'],
            buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
            registers: [this.registry],
        });

        this.failuresTotal = new Counter({
            name: 'gateway_failures_total',
            help: 'Total gateway failures',
            labelNames: ['service', 'error_type'],
            registers: [this.registry],
        });
    }

    getOrCreateCircuit(serviceName: string, config?: Partial<CircuitBreakerConfig>): ServiceCircuit {
        let circuit = this.circuits.get(serviceName);

        if (!circuit) {
            const finalConfig = { ...this.defaultConfig, ...config };

            const breaker = new CircuitBreaker(
                async (action: () => Promise<any>) => action(),
                {
                    timeout: finalConfig.timeout,
                    errorThresholdPercentage: finalConfig.errorThresholdPercentage,
                    resetTimeout: finalConfig.resetTimeout,
                    volumeThreshold: finalConfig.volumeThreshold,
                }
            );

            // Event handlers for metrics
            breaker.on('success', () => {
                this.circuitState.labels(serviceName).set(0);
                this.requestsTotal.labels(serviceName, 'all', 'success').inc();
            });

            breaker.on('failure', () => {
                this.failuresTotal.labels(serviceName, 'failure').inc();
                this.requestsTotal.labels(serviceName, 'all', 'failure').inc();
            });

            breaker.on('timeout', () => {
                this.failuresTotal.labels(serviceName, 'timeout').inc();
                this.requestsTotal.labels(serviceName, 'all', 'timeout').inc();
            });

            breaker.on('reject', () => {
                this.failuresTotal.labels(serviceName, 'rejected').inc();
                this.requestsTotal.labels(serviceName, 'all', 'rejected').inc();
            });

            breaker.on('open', () => {
                this.circuitState.labels(serviceName).set(1);
                console.warn(`[CircuitBreaker] ${serviceName}: OPEN - requests blocked`);
            });

            breaker.on('halfOpen', () => {
                this.circuitState.labels(serviceName).set(2);
                console.info(`[CircuitBreaker] ${serviceName}: HALF-OPEN - testing...`);
            });

            breaker.on('close', () => {
                this.circuitState.labels(serviceName).set(0);
                console.info(`[CircuitBreaker] ${serviceName}: CLOSED - normal operation`);
            });

            circuit = { breaker, name: serviceName };
            this.circuits.set(serviceName, circuit);
        }

        return circuit;
    }

    async execute<T>(serviceName: string, action: () => Promise<T>): Promise<T> {
        const circuit = this.getOrCreateCircuit(serviceName);
        const timer = this.requestDuration.startTimer({ service: serviceName, method: 'all' });

        try {
            const result = await circuit.breaker.fire(action);
            timer();
            return result;
        } catch (error) {
            timer();

            if (error.code === 'EOPENBREAKER') {
                throw new HttpException(
                    {
                        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
                        message: `Service ${serviceName} is temporarily unavailable. Please try again later.`,
                        circuitOpen: true,
                    },
                    HttpStatus.SERVICE_UNAVAILABLE,
                );
            }

            throw error;
        }
    }

    getStatus(serviceName?: string): Record<string, any> {
        if (serviceName) {
            const circuit = this.circuits.get(serviceName);
            if (!circuit) return { status: 'unknown' };
            return this.getCircuitStatus(circuit);
        }

        const status: Record<string, any> = {};
        for (const [name, circuit] of this.circuits.entries()) {
            status[name] = this.getCircuitStatus(circuit);
        }
        return status;
    }

    private getCircuitStatus(circuit: ServiceCircuit): Record<string, any> {
        const stats = circuit.breaker.stats;
        return {
            name: circuit.name,
            state: circuit.breaker.opened ? 'OPEN' : circuit.breaker.halfOpen ? 'HALF_OPEN' : 'CLOSED',
            stats: {
                successes: stats.successes,
                failures: stats.failures,
                timeouts: stats.timeouts,
                rejects: stats.rejects,
                fallbacks: stats.fallbacks,
            },
        };
    }

    async getMetrics(): Promise<string> {
        return this.registry.metrics();
    }
}

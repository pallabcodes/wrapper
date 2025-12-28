import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { CircuitBreakerService } from '../resilience/circuit-breaker.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    version: string;
    uptime: number;
    checks: Record<string, CheckResult>;
}

interface CheckResult {
    status: 'pass' | 'fail' | 'warn';
    responseTime?: number;
    message?: string;
}

@ApiTags('health')
@Controller()
export class HealthController {
    private readonly startTime = Date.now();
    private readonly version = process.env.APP_VERSION || '1.0.0';

    constructor(private readonly circuitBreaker: CircuitBreakerService) { }

    // Kubernetes liveness probe
    @Get('health')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Health check endpoint',
        description: 'Basic health check for liveness probes',
    })
    @ApiResponse({
        status: 200,
        description: 'Service is healthy',
        schema: {
            type: 'object',
            properties: {
                status: { type: 'string', example: 'ok' },
            },
        },
    })
    async health(): Promise<{ status: string }> {
        return { status: 'ok' };
    }

    // Kubernetes readiness probe
    @Get('ready')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Readiness check endpoint',
        description: 'Comprehensive readiness check including circuit breaker status and system health',
    })
    @ApiResponse({
        status: 200,
        description: 'Service is ready to handle requests',
        schema: {
            type: 'object',
            properties: {
                status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
                timestamp: { type: 'string', format: 'date-time' },
                version: { type: 'string' },
                uptime: { type: 'number' },
                checks: {
                    type: 'object',
                    additionalProperties: {
                        type: 'object',
                        properties: {
                            status: { type: 'string', enum: ['pass', 'fail', 'warn'] },
                            responseTime: { type: 'number', nullable: true },
                            message: { type: 'string', nullable: true },
                        },
                    },
                },
            },
        },
    })
    async ready(): Promise<HealthStatus> {
        const checks: Record<string, CheckResult> = {};
        let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

        // Check circuit breaker states
        const circuitStatus = this.circuitBreaker.getStatus();
        for (const [service, status] of Object.entries(circuitStatus)) {
            const state = (status as any).state;
            checks[`circuit:${service}`] = {
                status: state === 'CLOSED' ? 'pass' : state === 'HALF_OPEN' ? 'warn' : 'fail',
                message: state,
            };
            if (state === 'OPEN') overallStatus = 'degraded';
        }

        // Add memory check
        const memUsage = process.memoryUsage();
        const memPercent = memUsage.heapUsed / memUsage.heapTotal;
        checks['memory'] = {
            status: memPercent < 0.8 ? 'pass' : memPercent < 0.95 ? 'warn' : 'fail',
            message: `${(memPercent * 100).toFixed(1)}% heap used`,
        };
        if (memPercent >= 0.95) overallStatus = 'unhealthy';

        return {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            version: this.version,
            uptime: Math.floor((Date.now() - this.startTime) / 1000),
            checks,
        };
    }

    // Prometheus metrics endpoint
    @Get('metrics')
    @ApiOperation({
        summary: 'Prometheus metrics endpoint',
        description: 'Returns Prometheus-formatted metrics for monitoring',
    })
    @ApiResponse({
        status: 200,
        description: 'Metrics data',
        content: {
            'text/plain': {
                schema: { type: 'string' },
            },
        },
    })
    async metrics(): Promise<string> {
        return this.circuitBreaker.getMetrics();
    }

    // Detailed status for debugging
    @Get('.well-known/apollo/server-health')
    async apolloHealth(): Promise<{ status: string }> {
        return { status: 'pass' };
    }
}

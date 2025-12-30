/**
 * Health Controller
 *
 * Provides health check endpoints for K8s probes.
 *
 * Endpoints:
 * - GET /health      → Overall health status
 * - GET /health/live → Liveness probe (is process running?)
 */
import { Controller, Get } from '@nestjs/common';

interface HealthResponse {
    status: string;
    timestamp: string;
    uptime: number;
}

@Controller('health')
export class HealthController {
    private readonly startTime = Date.now();

    @Get()
    check(): HealthResponse {
        return this.buildResponse('ok');
    }

    @Get('live')
    liveness(): HealthResponse {
        return this.buildResponse('alive');
    }

    private buildResponse(status: string): HealthResponse {
        return {
            status,
            timestamp: new Date().toISOString(),
            uptime: Math.floor((Date.now() - this.startTime) / 1000),
        };
    }
}

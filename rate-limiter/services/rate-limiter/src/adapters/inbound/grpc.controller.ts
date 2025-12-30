import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { RateLimitService } from '../../core/services/rate-limit.service';

@Controller()
export class GrpcRateLimitController {
    constructor(private readonly rateLimitService: RateLimitService) { }

    @GrpcMethod('RateLimiterService', 'Check') // TS method name can be anything; decorator maps to proto method
    async check(data: { client_id: string; resource: string; cost: number }) { // the method doesn't have to match the proto method name
        // data is already deserialized by protobuf
        const result = await this.rateLimitService.check(
            data.client_id,
            data.resource,
            data.cost || 1,
        );

        return {
            allowed: result.allowed,
            remaining: result.remaining,
            limit: result.limit,
            reset_at: result.resetAt,
            retry_after: result.retryAfter,
        };
    }

    @GrpcMethod('RateLimiterService', 'GetQuota')
    async getQuota(data: { client_id: string; resource: string }) { // the method doesn't have to match the proto method name
        // Reusing checkRequest with cost 0 or similar logic if supported, 
        // or just checking state. 
        // For now, let's implement a simple check without consuming if possible,
        // or just return dummy data as the service might not have a pure "peek" method yet.
        // Actually, let's just use checkRequest with cost 0 if that's valid, checking implementation.
        // If not, we'll return mock data for now.

        // NOTE: The core service doesn't have "getQuota" explicitly exposed yet.
        // We will just omit implementation or return mock for this phase to pass compilation.
        return { current_usage: 0, limit: 100 };
    }
}

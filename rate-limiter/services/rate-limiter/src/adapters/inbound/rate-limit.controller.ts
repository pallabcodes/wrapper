
/**
 * Rate Limit Controller
 *
 * Endpoints:
 * - POST /check → Check if request is allowed
 * - GET /stats  → Get service stats
 */
import { Controller, Post, Get, Body, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RateLimitService } from '../../core/services/rate-limit.service';
import { CheckRequestDto } from './dto/check.dto';
import { CheckResponseDto } from './dto/response.dto';

@ApiTags('Rate Limiter')
@Controller()
export class RateLimitController {
    constructor(private readonly service: RateLimitService) { }

    @Post('check')
    @HttpCode(200)
    @ApiOperation({ summary: 'Check rate limit eligibility' })
    @ApiResponse({ status: 200, type: CheckResponseDto })
    async check(@Body() body: CheckRequestDto): Promise<CheckResponseDto> {
        const { clientId, resource, cost } = body;

         // Basic validation (don't trust cookies from strangers!)
        if (!clientId || !resource) {
            return {
                allowed: false,
                remaining: 0,
                limit: 0,
                resetAt: 0,
                retryAfter: 0,
            };
        }

        return this.service.check(clientId, resource, cost || 1);
    }
}

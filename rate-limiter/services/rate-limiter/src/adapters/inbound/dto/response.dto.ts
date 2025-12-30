import { ApiProperty } from '@nestjs/swagger';
import { RateLimitCheckResponse } from '@ratelimiter/common';

export class CheckResponseDto implements RateLimitCheckResponse {
    @ApiProperty({ example: true, description: 'Whether the request is allowed' })
    allowed!: boolean;

    @ApiProperty({ example: 99, description: 'Remaining tokens in the bucket' })
    remaining!: number;

    @ApiProperty({ example: 100, description: 'Total capacity of the bucket' })
    limit!: number;

    @ApiProperty({ example: 1678888888, description: 'Timestamp when bucket refills' })
    resetAt!: number;

    @ApiProperty({ example: 5, description: 'Seconds to wait before retry', required: false })
    retryAfter?: number;
}

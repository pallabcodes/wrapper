import { ApiProperty } from '@nestjs/swagger';
import { RateLimitCheckRequest } from '@ratelimiter/common';

export class CheckRequestDto implements RateLimitCheckRequest {
    @ApiProperty({ example: 'user-123', description: 'Unique identifier for the client' })
    clientId!: string;

    @ApiProperty({ example: '/api/v1/users', description: 'Resource being accessed' })
    resource!: string;

    @ApiProperty({ example: 1, description: 'Cost of the request', required: false })
    cost?: number;
}

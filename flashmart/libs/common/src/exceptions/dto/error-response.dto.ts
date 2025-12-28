import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message or array of messages',
    example: 'Validation failed',
  })
  message: string | string[];

  @ApiProperty({
    description: 'Error type',
    example: 'Bad Request',
  })
  error: string;

  @ApiProperty({
    description: 'Timestamp of the error',
    example: '2024-01-01T12:00:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Request path that caused the error',
    example: '/api/users',
  })
  path: string;

  @ApiProperty({
    description: 'Correlation ID for request tracing',
    example: 'req-123456789-abc123',
    required: false,
  })
  correlationId?: string;

  @ApiProperty({
    description: 'Additional error details',
    required: false,
  })
  details?: any;
}

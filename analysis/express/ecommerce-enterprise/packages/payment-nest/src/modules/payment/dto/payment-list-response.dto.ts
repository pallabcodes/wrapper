import { ApiProperty } from '@nestjs/swagger';
import { PaymentResponseDto } from './payment-response.dto';

export class PaymentListResponseDto {
  @ApiProperty({ description: 'List of payments', type: [PaymentResponseDto] })
  payments: PaymentResponseDto[] = [];

  @ApiProperty({ description: 'Total number of payments', example: 100 })
  total: number = 0;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number = 1;

  @ApiProperty({ description: 'Number of items per page', example: 10 })
  limit: number = 10;

  @ApiProperty({ description: 'Total number of pages', example: 10 })
  totalPages: number = 0;

  @ApiProperty({ description: 'Whether there is a next page', example: true })
  hasNext: boolean = false;

  @ApiProperty({ description: 'Whether there is a previous page', example: false })
  hasPrev: boolean = false;
}

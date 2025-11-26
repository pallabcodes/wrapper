import {
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
  UseGuards,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PaymentsService } from './payments.service';
import { PaymentsCreateChargeDto } from './dto/payments-create-charge.dto';

class ChargeResponseDto {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: Date;
}

@ApiTags('payments')
@Controller('payments')
@UseGuards(ThrottlerGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('charge')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Create payment charge',
    description: 'Process a payment charge through Stripe'
  })
  @ApiBody({
    type: PaymentsCreateChargeDto,
    description: 'Payment charge creation data',
    examples: {
      'valid-charge': {
        summary: 'Valid payment charge',
        value: {
          amount: 500,
          card: {
            number: '4242424242424242',
            expMonth: 12,
            expYear: 2025,
            cvc: '123'
          }
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Payment charge created successfully',
    type: ChargeResponseDto
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid payment data or card declined'
  })
  async createChargeHttp(@Payload() data: PaymentsCreateChargeDto) {
    return this.paymentsService.createCharge(data);
  }

  @MessagePattern('create_charge')
  @UsePipes(new ValidationPipe())
  async createCharge(@Payload() data: PaymentsCreateChargeDto) {
    return this.paymentsService.createCharge(data);
  }
}

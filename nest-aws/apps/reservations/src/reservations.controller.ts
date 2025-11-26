import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  HttpCode,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { CurrentUser, JwtAuthGuard, Roles, UserDto } from '@app/common';

class ReservationResponseDto {
  _id: string;
  timestamp: Date;
  startDate: Date;
  endDate: Date;
  userId: string;
  invoiceId: string;
}

@ApiTags('reservations')
@Controller('reservations')
@UseGuards(ThrottlerGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create reservation',
    description: 'Create a new hotel/accommodation reservation'
  })
  @ApiBody({
    type: CreateReservationDto,
    description: 'Reservation creation data with charge information',
    examples: {
      'valid-reservation': {
        summary: 'Valid reservation booking',
        value: {
          startDate: '2024-12-25T00:00:00.000Z',
          endDate: '2024-12-30T00:00:00.000Z',
          charge: {
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
    }
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Reservation created successfully',
    type: ReservationResponseDto
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - invalid or missing JWT token'
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid reservation data'
  })
  async create(
    @Body() createReservationDto: CreateReservationDto,
    @CurrentUser() user: UserDto,
  ) {
    return this.reservationsService.create(createReservationDto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get all reservations',
    description: 'Retrieve all reservations (admin access)'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reservations retrieved successfully',
    type: [ReservationResponseDto]
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - invalid or missing JWT token'
  })
  async findAll() {
    return this.reservationsService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get reservation by ID',
    description: 'Retrieve a specific reservation by its ID'
  })
  @ApiParam({
    name: 'id',
    description: 'Reservation ID',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reservation retrieved successfully',
    type: ReservationResponseDto
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - invalid or missing JWT token'
  })
  @ApiNotFoundResponse({
    description: 'Reservation not found'
  })
  async findOne(@Param('id') id: string) {
    return this.reservationsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update reservation',
    description: 'Update an existing reservation'
  })
  @ApiParam({
    name: 'id',
    description: 'Reservation ID',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiBody({
    type: UpdateReservationDto,
    description: 'Reservation update data'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reservation updated successfully',
    type: ReservationResponseDto
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - invalid or missing JWT token'
  })
  @ApiNotFoundResponse({
    description: 'Reservation not found'
  })
  async update(
    @Param('id') id: string,
    @Body() updateReservationDto: UpdateReservationDto,
  ) {
    return this.reservationsService.update(id, updateReservationDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles('Admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete reservation',
    description: 'Delete a reservation (admin only)'
  })
  @ApiParam({
    name: 'id',
    description: 'Reservation ID',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Reservation deleted successfully'
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - invalid or missing JWT token'
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - admin role required'
  })
  @ApiNotFoundResponse({
    description: 'Reservation not found'
  })
  async remove(@Param('id') id: string) {
    return this.reservationsService.remove(id);
  }
}

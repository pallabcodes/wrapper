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
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotifyEmailDto } from './dto/notify-email.dto';
import { NotificationsService } from './notifications.service';

class EmailNotificationResponseDto {
  success: boolean;
  messageId?: string;
  timestamp: Date;
}

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(ThrottlerGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('email')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Send email notification',
    description: 'Send an email notification to a user'
  })
  @ApiBody({
    type: NotifyEmailDto,
    description: 'Email notification data',
    examples: {
      'welcome-email': {
        summary: 'Welcome email notification',
        value: {
          email: 'user@example.com',
          text: 'Welcome to our platform!'
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email notification sent successfully',
    type: EmailNotificationResponseDto
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid email data'
  })
  async sendEmailNotification(@Payload() data: NotifyEmailDto) {
    await this.notificationsService.notifyEmail(data);
    return {
      success: true,
      timestamp: new Date(),
      message: 'Email notification queued successfully'
    };
  }

  @UsePipes(new ValidationPipe())
  @EventPattern('notify_email')
  async notifyEmail(@Payload() data: NotifyEmailDto) {
    await this.notificationsService.notifyEmail(data);
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Notification, NotificationType, NotificationPriority } from '../../domain/entities/notification.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { PhoneNumber } from '../../domain/value-objects/phone-number.vo';
import { DomainException } from '../../domain/exceptions/domain.exception';
import {
  INotificationRepository,
  NOTIFICATION_REPOSITORY
} from '../../domain/ports/notification-repository.port';
import {
  IEmailProvider,
  ISMSProvider,
  IPushProvider,
  EMAIL_PROVIDER,
  SMS_PROVIDER,
  PUSH_PROVIDER
} from '../../domain/ports/notification-providers.port';
import {
  ITemplateService,
  TEMPLATE_SERVICE
} from '../../domain/ports/notification-template.port';

export interface SendNotificationRequest {
  userId: string;
  type: NotificationType;
  recipient: string; // Email, phone, or push token
  subject?: string; // For email notifications
  content: string;
  templateName?: string; // Optional template to use
  templateVariables?: Record<string, string | number | boolean>; // Variables for template
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  metadata?: Record<string, unknown>;
  idempotencyKey?: string;
}

export interface SendNotificationResponse {
  notificationId: string;
  status: string;
  estimatedDeliveryTime?: Date;
}

/**
 * Use Case: Send Notification
 *
 * Handles sending notifications through appropriate channels
 * Supports templates, priority handling, and delivery tracking
 */
@Injectable()
export class SendNotificationUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
    @Inject(EMAIL_PROVIDER)
    private readonly emailProvider: IEmailProvider,
    @Inject(SMS_PROVIDER)
    private readonly smsProvider: ISMSProvider,
    @Inject(PUSH_PROVIDER)
    private readonly pushProvider: IPushProvider,
    @Inject(TEMPLATE_SERVICE)
    private readonly templateService: ITemplateService,
  ) { }

  async execute(request: SendNotificationRequest): Promise<SendNotificationResponse> {
    // 1. Validate notification type
    if (!Object.values(NotificationType).includes(request.type)) {
      throw DomainException.invalidNotificationType();
    }

    // 2. Check for idempotency
    if (request.idempotencyKey) {
      const existingNotification = await this.notificationRepository.findByIdempotencyKey(request.idempotencyKey);
      if (existingNotification) {
        return {
          notificationId: existingNotification.getId(),
          status: existingNotification.getStatus(),
          estimatedDeliveryTime: undefined // Already processed
        };
      }
    }

    // 3. Process template if specified
    let finalSubject = request.subject;
    let finalContent = request.content;

    if (request.templateName) {
      const template = await this.templateService.getTemplate(request.templateName);
      if (!template) {
        throw DomainException.templateNotFound(request.templateName);
      }

      if (!this.templateService.validateVariables(template, request.templateVariables || {})) {
        throw new DomainException('Template variables are invalid or missing', 'INVALID_TEMPLATE_VARIABLES');
      }

      const rendered = await this.templateService.renderTemplate(template, request.templateVariables || {});
      finalSubject = rendered.subject || request.subject;
      finalContent = rendered.content;
    }

    // 3. Validate and parse recipient based on type
    let parsedRecipient: Email | PhoneNumber | string;

    try {
      if (request.type === NotificationType.EMAIL) {
        parsedRecipient = Email.create(request.recipient);
      } else if (request.type === NotificationType.SMS) {
        parsedRecipient = PhoneNumber.create(request.recipient);
      } else {
        parsedRecipient = request.recipient; // Push token or in-app identifier
      }
    } catch (error) {
      throw DomainException.invalidRecipient();
    }

    // 4. Map priority
    const priority = this.mapPriority(request.priority);

    // 5. Generate notification ID
    const notificationId = uuidv4();

    // 6. Create notification entity
    const notification = Notification.create(
      notificationId,
      request.userId,
      request.type,
      parsedRecipient,
      finalSubject || '',
      finalContent,
      priority,
      request.metadata as Record<string, unknown> || {},
      request.idempotencyKey
    );

    // 7. Save notification to repository
    await this.notificationRepository.save(notification);

    // 8. Send notification through appropriate provider
    try {
      const result = await this.sendThroughProvider(notification);

      if (result.success) {
        notification.markAsSent();
        await this.notificationRepository.update(notification);

        return {
          notificationId,
          status: notification.getStatus(),
          estimatedDeliveryTime: this.calculateEstimatedDeliveryTime(notification)
        };
      } else {
        notification.markAsFailed(result.error);
        await this.notificationRepository.update(notification);
        throw new DomainException(`Notification delivery failed: ${result.error}`, 'DELIVERY_FAILED');
      }
    } catch (error) {
      notification.markAsFailed(error.message);
      await this.notificationRepository.update(notification);
      throw error;
    }
  }

  private mapPriority(priority?: string): NotificationPriority {
    const priorityMap: Record<string, NotificationPriority> = {
      'low': NotificationPriority.LOW,
      'normal': NotificationPriority.NORMAL,
      'high': NotificationPriority.HIGH,
      'urgent': NotificationPriority.URGENT
    };

    return priorityMap[priority || 'normal'] || NotificationPriority.NORMAL;
  }

  private async sendThroughProvider(notification: Notification): Promise<{ success: boolean; error?: string }> {
    const recipient = notification.getRecipient();

    try {
      switch (notification.getType()) {
        case NotificationType.EMAIL:
          if (!(recipient instanceof Email)) {
            throw new Error('Invalid email recipient');
          }
          return await this.emailProvider.sendEmail({
            to: recipient,
            subject: notification.getSubject(),
            html: notification.getContent(),
            text: this.stripHtml(notification.getContent())
          });

        case NotificationType.SMS:
          if (!(recipient instanceof PhoneNumber)) {
            throw new Error('Invalid SMS recipient');
          }
          return await this.smsProvider.sendSMS({
            to: recipient,
            message: notification.getContent()
          });

        case NotificationType.PUSH:
          return await this.pushProvider.sendPush({
            to: recipient as string,
            title: notification.getSubject(),
            body: notification.getContent(),
            data: notification.getMetadata()
          });

        case NotificationType.IN_APP:
          // In-app notifications are handled differently - they might be stored for retrieval
          return { success: true };

        default:
          throw new Error(`Unsupported notification type: ${notification.getType()}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: message
      };
    }
  }

  private stripHtml(html: string): string {
    // Simple HTML stripping for text version of emails
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  private calculateEstimatedDeliveryTime(notification: Notification): Date {
    const baseTime = new Date();

    // Different delivery times based on notification type and priority
    const deliveryTimes = {
      [NotificationType.EMAIL]: {
        low: 5 * 60 * 1000,      // 5 minutes
        normal: 2 * 60 * 1000,   // 2 minutes
        high: 30 * 1000,         // 30 seconds
        urgent: 10 * 1000        // 10 seconds
      },
      [NotificationType.SMS]: {
        low: 10 * 60 * 1000,     // 10 minutes
        normal: 5 * 60 * 1000,   // 5 minutes
        high: 1 * 60 * 1000,     // 1 minute
        urgent: 30 * 1000        // 30 seconds
      },
      [NotificationType.PUSH]: {
        low: 2 * 60 * 1000,      // 2 minutes
        normal: 30 * 1000,       // 30 seconds
        high: 10 * 1000,         // 10 seconds
        urgent: 5 * 1000         // 5 seconds
      },
      [NotificationType.IN_APP]: {
        low: 1 * 60 * 1000,      // 1 minute
        normal: 10 * 1000,       // 10 seconds
        high: 5 * 1000,          // 5 seconds
        urgent: 1 * 1000         // 1 second
      }
    };

    const typeTimes = deliveryTimes[notification.getType()];
    const priorityTime = typeTimes[notification.getPriority() as keyof typeof typeTimes] || typeTimes.normal;

    return new Date(baseTime.getTime() + priorityTime);
  }
}
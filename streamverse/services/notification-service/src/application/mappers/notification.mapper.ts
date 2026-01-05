import { Notification } from '../../domain/entities/notification.entity';
import { NotificationResponse } from '../dto/notification-response.dto';

/**
 * Application Layer: Notification Mapper
 *
 * Converts between domain entities and application DTOs
 */
export class NotificationMapper {
  static toNotificationResponse(notification: Notification): NotificationResponse {
    return new NotificationResponse(
      notification.getId(),
      notification.getUserId(),
      notification.getType(),
      notification.getRecipientValue(),
      notification.getContent(),
      notification.getPriority(),
      notification.getStatus(),
      notification.getMetadata(),
      notification.getCreatedAt(),
      notification.getUpdatedAt(),
      notification.getSubject(),
      notification.getSentAt(),
      notification.getDeliveredAt(),
      notification.getFailedAt(),
      notification.getFailureReason()
    );
  }

  static toNotificationResponses(notifications: Notification[]): NotificationResponse[] {
    return notifications.map(notification => this.toNotificationResponse(notification));
  }
}

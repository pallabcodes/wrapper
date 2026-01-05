import { NotificationType, NotificationStatus, NotificationPriority } from '../../domain/entities/notification.entity';

/**
 * Application Layer: Notification Response DTO
 *
 * Clean internal contract for notification data responses
 */
export class NotificationResponse {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly type: NotificationType,
    public readonly recipient: string,
    public readonly content: string,
    public readonly priority: NotificationPriority,
    public readonly status: NotificationStatus,
    public readonly metadata: Record<string, any>,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly subject?: string,
    public readonly sentAt?: Date,
    public readonly deliveredAt?: Date,
    public readonly failedAt?: Date,
    public readonly failureReason?: string
  ) {}
}

import { Notification, NotificationType, NotificationStatus } from '../entities/notification.entity';

export interface INotificationRepository {
  /**
   * Save a notification to the database
   */
  save(notification: Notification): Promise<void>;

  /**
   * Find notification by ID
   */
  findById(id: string): Promise<Notification | null>;

  /**
   * Find notifications by user ID
   */
  findByUserId(userId: string, limit?: number): Promise<Notification[]>;

  /**
   * Find notifications by type
   */
  findByType(type: NotificationType, limit?: number): Promise<Notification[]>;

  /**
   * Find notifications by status
   */
  findByStatus(status: NotificationStatus, limit?: number): Promise<Notification[]>;

  /**
   * Update notification status
   */
  update(notification: Notification): Promise<void>;

  /**
   * Delete notification
   */
  delete(id: string): Promise<void>;

  /**
   * Find notifications by recipient and type within a time window
   * Used for idempotency checks to prevent duplicate processing
   */
  findByRecipientAndTypeWithinTimeframe(
    recipient: string,
    type: NotificationType,
    timeframeMs: number
  ): Promise<Notification[]>;

  /**
   * Find notification by unique idempotency key
   */
  findByIdempotencyKey(key: string): Promise<Notification | null>;

  /**
   * Get notification statistics
   */
  getStats(): Promise<{
    total: number;
    pending: number;
    sent: number;
    delivered: number;
    failed: number;
  }>;
}

export const NOTIFICATION_REPOSITORY = Symbol('INotificationRepository');

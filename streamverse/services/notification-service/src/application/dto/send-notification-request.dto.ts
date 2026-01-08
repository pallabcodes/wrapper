import { NotificationType } from '../../domain/entities/notification.entity';

/**
 * Application Layer: Send Notification Request DTO
 *
 * Clean internal contract for notification sending requests
 */
export class SendNotificationRequest {
  constructor(
    public readonly userId: string,
    public readonly type: NotificationType,
    public readonly recipient: string,
    public readonly content: string,
    public readonly subject?: string,
    public readonly templateName?: string,
    public readonly templateVariables?: Record<string, string | number | boolean>,
    public readonly priority?: 'low' | 'normal' | 'high' | 'urgent',
    public readonly metadata?: Record<string, unknown>,
    public readonly idempotencyKey?: string
  ) { }
}

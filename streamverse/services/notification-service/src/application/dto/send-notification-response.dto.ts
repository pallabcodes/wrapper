/**
 * Application Layer: Send Notification Response DTO
 *
 * Clean internal contract for notification sending responses
 */
export class SendNotificationResponse {
  constructor(
    public readonly notificationId: string,
    public readonly status: string,
    public readonly estimatedDeliveryTime?: Date
  ) {}
}

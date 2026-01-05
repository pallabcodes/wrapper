export interface INotificationService {
  /**
   * Send payment created notification
   */
  sendPaymentCreated(paymentId: string, userId: string, amount: number, currency: string): Promise<void>;

  /**
   * Send payment completed notification
   */
  sendPaymentCompleted(paymentId: string, userId: string, amount: number, currency: string): Promise<void>;

  /**
   * Send payment failed notification
   */
  sendPaymentFailed(paymentId: string, userId: string, amount: number, currency: string, reason?: string): Promise<void>;

  /**
   * Send refund processed notification
   */
  sendRefundProcessed(paymentId: string, userId: string, refundAmount: number, currency: string): Promise<void>;
}

export const NOTIFICATION_SERVICE = Symbol('INotificationService');

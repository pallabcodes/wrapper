import { Injectable } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';

export interface NotificationPayload {
  userId?: string;
  room?: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  data?: unknown;
}

@Injectable()
export class NotificationsService {
  constructor(private notificationsGateway: NotificationsGateway) {}

  sendToUser(userId: string, payload: NotificationPayload) {
    this.notificationsGateway.sendToUser(userId, 'notification', payload);
  }

  sendToRoom(room: string, payload: NotificationPayload) {
    this.notificationsGateway.sendToRoom(room, 'notification', payload);
  }

  broadcast(payload: NotificationPayload) {
    this.notificationsGateway.broadcast('notification', payload);
  }

  sendEmailVerificationNotification(userId: string, email: string) {
    this.sendToUser(userId, {
      type: 'info',
      title: 'Email Verification',
      message: `Please verify your email: ${email}`,
    });
  }

  sendPasswordResetNotification(userId: string) {
    this.sendToUser(userId, {
      type: 'info',
      title: 'Password Reset',
      message: 'Your password has been reset successfully',
    });
  }

  sendPaymentNotification(userId: string, status: string, amount: number) {
    this.sendToUser(userId, {
      type: status === 'completed' ? 'success' : 'warning',
      title: 'Payment Update',
      message: `Payment ${status}: $${amount}`,
      data: { status, amount },
    });
  }
}


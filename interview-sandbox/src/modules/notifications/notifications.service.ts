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

  // Registration success notification
  sendRegistrationSuccessNotification(userId: string, email: string) {
    this.sendToUser(userId, {
      type: 'success',
      title: 'Welcome!',
      message: `Account created successfully. Please verify your email: ${email}`,
      data: { email },
    });
  }

  // Email verified notification
  sendEmailVerifiedNotification(userId: string) {
    this.sendToUser(userId, {
      type: 'success',
      title: 'Email Verified',
      message: 'Your email has been verified successfully!',
    });
  }

  // Login notification (security)
  sendLoginNotification(userId: string, ipAddress?: string) {
    this.sendToUser(userId, {
      type: 'info',
      title: 'New Login',
      message: `You logged in successfully${ipAddress ? ` from ${ipAddress}` : ''}`,
      data: { ipAddress, timestamp: Date.now() },
    });
  }

  // File upload notification
  sendFileUploadNotification(userId: string, filename: string) {
    this.sendToUser(userId, {
      type: 'success',
      title: 'File Uploaded',
      message: `File "${filename}" uploaded successfully`,
      data: { filename },
    });
  }

  // File deleted notification
  sendFileDeletedNotification(userId: string, filename: string) {
    this.sendToUser(userId, {
      type: 'info',
      title: 'File Deleted',
      message: `File "${filename}" deleted successfully`,
      data: { filename },
    });
  }

  // Custom notification
  sendCustomNotification(userId: string, type: 'info' | 'success' | 'warning' | 'error', title: string, message: string, data?: unknown) {
    this.sendToUser(userId, {
      type,
      title,
      message,
      data,
    });
  }
}


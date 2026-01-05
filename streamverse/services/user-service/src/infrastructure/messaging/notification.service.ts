import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
// Infrastructure using Domain VO for validation
import { Email } from '../../domain/value-objects/email.vo';
import { INotificationService, NOTIFICATION_SERVICE } from '../../domain/ports/notification-service.port';

/**
 * Infrastructure: Notification Service
 *
 * Implements INotificationService using message queue to notification-service
 */
@Injectable()
export class MessageQueueNotificationService implements INotificationService {
  constructor(
    @Inject('NOTIFICATION_SERVICE') // Inject message queue client
    private readonly notificationClient: ClientProxy,
  ) { }

  async sendEmailVerification(userId: string, email: Email, verificationToken: string): Promise<void> {
    await this.notificationClient.emit('user.email.verification', {
      userId,
      email: email.getValue(),
      token: verificationToken,
      type: 'email_verification',
      timestamp: new Date(),
    }).toPromise();
  }

  async sendPasswordReset(email: Email, resetToken: string, resetUrl: string): Promise<void> {
    await this.notificationClient.emit('user.password.reset', {
      email: email.getValue(),
      token: resetToken,
      resetUrl: resetUrl,
      type: 'password_reset',
      timestamp: new Date(),
    }).toPromise();
  }

  async sendWelcomeEmail(email: Email, username: string): Promise<void> {
    await this.notificationClient.emit('user.welcome', {
      email: email.getValue(),
      username,
      type: 'welcome',
      timestamp: new Date(),
    }).toPromise();
  }

  async sendAccountSuspended(email: Email, reason?: string): Promise<void> {
    await this.notificationClient.emit('user.account.suspended', {
      email: email.getValue(),
      reason: reason || 'Violation of terms of service',
      type: 'account_suspended',
      timestamp: new Date(),
    }).toPromise();
  }

  async sendAccountReactivated(email: Email): Promise<void> {
    await this.notificationClient.emit('user.account.reactivated', {
      email: email.getValue(),
      type: 'account_reactivated',
      timestamp: new Date(),
    }).toPromise();
  }

  async sendMagicLink(email: Email, magicLinkUrl: string): Promise<void> {
    await this.notificationClient.emit('user.magic.link', {
      email: email.getValue(),
      magicLinkUrl,
      type: 'magic_link',
      timestamp: new Date(),
    }).toPromise();
  }

  async sendOtp(identifier: string, code: string, type: 'email' | 'sms'): Promise<void> {
    const eventName = type === 'email' ? 'user.otp.email' : 'user.otp.sms';
    await this.notificationClient.emit(eventName, {
      identifier,
      code,
      type: `otp_${type}`,
      timestamp: new Date(),
    }).toPromise();
  }
}

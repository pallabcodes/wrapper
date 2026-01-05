import { Email } from '../value-objects/email.vo';

/**
 * Port: Notification Service
 *
 * Interface for sending notifications (email, SMS, push)
 * Communicates with notification-service microservice
 */
export interface INotificationService {
  /**
   * Send email verification link
   */
  sendEmailVerification(userId: string, email: Email, verificationToken: string): Promise<void>;

  /**
   * Send password reset email
   */
  sendPasswordReset(email: Email, resetToken: string, resetUrl: string): Promise<void>;

  /**
   * Send welcome email to new user
   */
  sendWelcomeEmail(email: Email, username: string): Promise<void>;

  /**
   * Send account suspension notification
   */
  sendAccountSuspended(email: Email, reason?: string): Promise<void>;

  /**
   * Send account reactivation notification
   */
  sendAccountReactivated(email: Email): Promise<void>;

  /**
   * Send magic link login email
   */
  sendMagicLink(email: Email, magicLinkUrl: string): Promise<void>;

  /**
   * Send OTP code via Email or SMS
   */
  sendOtp(identifier: string, code: string, type: 'email' | 'sms'): Promise<void>;
}

export const NOTIFICATION_SERVICE = Symbol('INotificationService');

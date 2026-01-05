import { Email } from '../value-objects/email.vo';
import { PhoneNumber } from '../value-objects/phone-number.vo';

export interface EmailContent {
  to: Email;
  subject: string;
  html: string;
  text?: string;
}

export interface SMSContent {
  to: PhoneNumber;
  message: string;
}

export interface PushContent {
  to: string; // Device token
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface NotificationResult {
  success: boolean;
  providerId?: string; // External provider's message ID
  error?: string;
}

export interface IEmailProvider {
  /**
   * Send an email notification
   */
  sendEmail(content: EmailContent): Promise<NotificationResult>;
}

export interface ISMSProvider {
  /**
   * Send an SMS notification
   */
  sendSMS(content: SMSContent): Promise<NotificationResult>;
}

export interface IPushProvider {
  /**
   * Send a push notification
   */
  sendPush(content: PushContent): Promise<NotificationResult>;
}

export const EMAIL_PROVIDER = Symbol('IEmailProvider');
export const SMS_PROVIDER = Symbol('ISMSProvider');
export const PUSH_PROVIDER = Symbol('IPushProvider');

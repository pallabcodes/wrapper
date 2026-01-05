import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as SendGrid from '@sendgrid/mail';
import { Email } from '../../domain/value-objects/email.vo';
import {
  IEmailProvider,
  EmailContent,
  NotificationResult,
  EMAIL_PROVIDER
} from '../../domain/ports/notification-providers.port';

/**
 * Infrastructure: SendGrid Email Provider
 *
 * Implements IEmailProvider using SendGrid for email delivery
 */
@Injectable()
export class SendGridEmailProvider implements IEmailProvider {
  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY is not configured');
    }

    SendGrid.setApiKey(apiKey);
  }

  async sendEmail(content: EmailContent): Promise<NotificationResult> {
    try {
      const fromEmail = this.configService.get<string>('SENDGRID_FROM_EMAIL', 'noreply@streamverse.com');

      const message = {
        to: content.to.getValue(),
        from: fromEmail,
        subject: content.subject,
        html: content.html,
        text: content.text,
        // Additional SendGrid features can be added here
        // trackingSettings: { ... },
        // mailSettings: { ... },
      };

      const result = await SendGrid.send(message);

      return {
        success: true,
        providerId: result[0]?.headers?.['x-message-id'] || 'sendgrid-sent'
      };
    } catch (error: unknown) {
      console.error('SendGrid email sending failed:', error);

      const message = error instanceof Error ? error.message : 'Unknown SendGrid error';
      return {
        success: false,
        error: message
      };
    }
  }
}

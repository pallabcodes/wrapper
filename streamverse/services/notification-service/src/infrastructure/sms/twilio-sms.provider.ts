import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Twilio from 'twilio';
import { PhoneNumber } from '../../domain/value-objects/phone-number.vo';
import {
  ISMSProvider,
  SMSContent,
  NotificationResult,
  SMS_PROVIDER
} from '../../domain/ports/notification-providers.port';

/**
 * Infrastructure: Twilio SMS Provider
 *
 * Implements ISMSProvider using Twilio for SMS delivery
 */
@Injectable()
export class TwilioSMSProvider implements ISMSProvider {
  private twilioClient: Twilio.Twilio;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');

    if (!accountSid || !authToken) {
      throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be configured');
    }

    this.twilioClient = Twilio(accountSid, authToken);
  }

  async sendSMS(content: SMSContent): Promise<NotificationResult> {
    try {
      const fromNumber = this.configService.get<string>('TWILIO_FROM_NUMBER');
      if (!fromNumber) {
        throw new Error('TWILIO_FROM_NUMBER is not configured');
      }

      const message = await this.twilioClient.messages.create({
        body: content.message,
        from: fromNumber,
        to: content.to.getValue(),
        // Additional Twilio features can be added here
        // statusCallback: '...',
        // messagingServiceSid: '...',
      });

      return {
        success: true,
        providerId: message.sid
      };
    } catch (error: unknown) {
      console.error('Twilio SMS sending failed:', error);

      const message = error instanceof Error ? error.message : 'Unknown Twilio error';
      return {
        success: false,
        error: message
      };
    }
  }
}

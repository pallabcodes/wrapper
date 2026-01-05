import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ITemplateService,
  NotificationTemplate,
  TemplateVariables,
  TEMPLATE_SERVICE
} from '../../domain/ports/notification-template.port';

/**
 * Infrastructure: Notification Template Service
 *
 * Implements ITemplateService for managing and rendering notification templates
 */
@Injectable()
export class NotificationTemplateService implements ITemplateService {
  private templates: Map<string, NotificationTemplate> = new Map();

  constructor(private configService: ConfigService) {
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    // Email templates
    this.templates.set('welcome', {
      name: 'welcome',
      type: 'email',
      subject: 'Welcome to StreamVerse!',
      content: `
        <h1>Welcome to StreamVerse, {{username}}!</h1>
        <p>Thank you for joining our community of creators and viewers.</p>
        <p>Your account has been successfully created and you're ready to start streaming!</p>
        <p>Get started by:</p>
        <ul>
          <li>Setting up your profile</li>
          <li>Exploring live streams</li>
          <li>Connecting with other creators</li>
        </ul>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Happy streaming!<br>The StreamVerse Team</p>
      `,
      variables: ['username']
    });

    this.templates.set('email-verification', {
      name: 'email-verification',
      type: 'email',
      subject: 'Verify Your Email - StreamVerse',
      content: `
        <h1>Verify Your Email Address</h1>
        <p>Hi {{username}},</p>
        <p>Please verify your email address to complete your StreamVerse registration.</p>
        <p>Click the link below to verify your account:</p>
        <p><a href="{{verificationUrl}}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a></p>
        <p>Or copy and paste this URL into your browser:</p>
        <p>{{verificationUrl}}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
      `,
      variables: ['username', 'verificationUrl']
    });

    this.templates.set('password-reset', {
      name: 'password-reset',
      type: 'email',
      subject: 'Reset Your Password - StreamVerse',
      content: `
        <h1>Reset Your Password</h1>
        <p>Hi {{username}},</p>
        <p>You requested a password reset for your StreamVerse account.</p>
        <p>Click the link below to reset your password:</p>
        <p><a href="{{resetUrl}}" style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
        <p>Or copy and paste this URL into your browser:</p>
        <p>{{resetUrl}}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this reset, please ignore this email. Your password will remain unchanged.</p>
      `,
      variables: ['username', 'resetUrl']
    });

    // SMS templates
    this.templates.set('payment-success', {
      name: 'payment-success',
      type: 'sms',
      content: 'Payment of ${{amount}} for "{{description}}" was successful. Thank you for using StreamVerse!',
      variables: ['amount', 'description']
    });

    this.templates.set('stream-live', {
      name: 'stream-live',
      type: 'sms',
      content: '{{streamerName}} is now live on StreamVerse! Watch now: {{streamUrl}}',
      variables: ['streamerName', 'streamUrl']
    });

    // Push notification templates
    this.templates.set('new-follower', {
      name: 'new-follower',
      type: 'push',
      subject: 'New Follower!',
      content: '{{followerName}} started following you on StreamVerse',
      variables: ['followerName']
    });

    this.templates.set('stream-started', {
      name: 'stream-started',
      type: 'push',
      subject: '{{streamerName}} is Live!',
      content: '{{streamerName}} just went live. Tap to watch!',
      variables: ['streamerName']
    });
  }

  async getTemplate(name: string): Promise<NotificationTemplate | null> {
    return this.templates.get(name) || null;
  }

  async renderTemplate(template: NotificationTemplate, variables: TemplateVariables): Promise<{
    subject?: string;
    content: string;
  }> {
    let content = template.content;
    let subject = template.subject;

    // Replace variables in content
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, String(value));
      if (subject) {
        subject = subject.replace(regex, String(value));
      }
    }

    return {
      subject,
      content
    };
  }

  validateVariables(template: NotificationTemplate, variables: TemplateVariables): boolean {
    // Check if all required variables are provided
    for (const requiredVar of template.variables) {
      if (!(requiredVar in variables)) {
        return false;
      }
    }

    // Check if all provided variables are strings/numbers/booleans
    for (const value of Object.values(variables)) {
      if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
        return false;
      }
    }

    return true;
  }
}

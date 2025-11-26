import { Injectable } from '@nestjs/common';
import { DomainEventHandler } from '../domain-event-dispatcher';
import { UserRegisteredEvent, UserEmailVerifiedEvent, UserLoggedInEvent } from '../user-events';

/**
 * Domain Event Handlers for User-related side effects
 * These handlers are called asynchronously when domain events are published
 */

@Injectable()
@DomainEventHandler('UserRegisteredEvent')
export class UserRegisteredEventHandler {
  async handle(event: UserRegisteredEvent): Promise<void> {
    console.log(`📧 Sending welcome email to ${event.email} for user ${event.userId}`);

    // In a real application, this would:
    // 1. Send welcome email via email service
    // 2. Create user preferences
    // 3. Initialize user analytics
    // 4. Send notification to admin dashboard
    // 5. Trigger onboarding workflow

    // Simulate async email sending
    await this.sendWelcomeEmail(event.email, event.name);

    // Log user registration for analytics
    await this.logUserRegistration(event);
  }

  private async sendWelcomeEmail(email: string, name: string): Promise<void> {
    // Simulate email service call
    console.log(`✅ Welcome email sent to ${name} <${email}>`);
  }

  private async logUserRegistration(event: UserRegisteredEvent): Promise<void> {
    // Simulate analytics logging
    console.log(`📊 User registration logged: ${event.userId} - ${event.email}`);
  }
}

@Injectable()
@DomainEventHandler('UserEmailVerifiedEvent')
export class UserEmailVerifiedEventHandler {
  async handle(event: UserEmailVerifiedEvent): Promise<void> {
    console.log(`🎉 Processing email verification for user ${event.userId}`);

    // In a real application, this would:
    // 1. Update user status in external systems
    // 2. Send email verification confirmation
    // 3. Unlock premium features
    // 4. Trigger welcome series emails
    // 5. Update user analytics

    await this.sendVerificationConfirmation(event.email);
    await this.unlockUserFeatures(event.userId);
    await this.updateAnalytics(event);
  }

  private async sendVerificationConfirmation(email: string): Promise<void> {
    console.log(`✅ Email verification confirmation sent to ${email}`);
  }

  private async unlockUserFeatures(userId: string): Promise<void> {
    console.log(`🔓 Premium features unlocked for user ${userId}`);
  }

  private async updateAnalytics(event: UserEmailVerifiedEvent): Promise<void> {
    console.log(`📊 Email verification analytics updated for ${event.userId}`);
  }
}

@Injectable()
@DomainEventHandler('UserLoggedInEvent')
export class UserLoggedInEventHandler {
  async handle(event: UserLoggedInEvent): Promise<void> {
    console.log(`🔐 Processing login for user ${event.userId}`);

    // In a real application, this would:
    // 1. Update last login timestamp
    // 2. Check for suspicious login activity
    // 3. Update user session analytics
    // 4. Send login notifications if configured
    // 5. Update security monitoring

    await this.updateLastLogin(event.userId);
    await this.checkSecurity(event);
    await this.updateAnalytics(event);
  }

  private async updateLastLogin(userId: string): Promise<void> {
    console.log(`⏰ Last login timestamp updated for user ${userId}`);
  }

  private async checkSecurity(event: UserLoggedInEvent): Promise<void> {
    // Simulate security check
    if (event.ipAddress) {
      console.log(`🛡️ Security check passed for IP: ${event.ipAddress}`);
    }
  }

  private async updateAnalytics(event: UserLoggedInEvent): Promise<void> {
    console.log(`📊 Login analytics updated for ${event.userId}`);
  }
}
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserRegisteredEvent } from '../../../../events/auth/user-registered.event';

@Injectable()
export class UserRegisteredHandler {
  @OnEvent('UserRegisteredEvent')
  async handleUserRegistered(event: UserRegisteredEvent): Promise<void> {
    console.log(`🎉 User registered: ${event.userId} - ${event.email}`);

    // In a real implementation, this could:
    // - Send welcome email
    // - Create user profile in external system
    // - Initialize user preferences
    // - Trigger notification to admin
    // - Update analytics

    try {
      // Simulate sending welcome email
      await this.sendWelcomeEmail(event.email, event.name);

      // Simulate creating notification
      await this.createWelcomeNotification(event.userId, event.name);

      console.log(`✅ User registration completed for: ${event.email}`);
    } catch (error) {
      console.error(`❌ Error handling user registration:`, error);
      // In production, you'd want to implement retry logic or dead letter queue
    }
  }

  private async sendWelcomeEmail(email: string, name: string): Promise<void> {
    console.log(`📧 Sending welcome email to ${email} for ${name}`);
    // Implementation would integrate with email service
  }

  private async createWelcomeNotification(userId: string, _name: string): Promise<void> {
    console.log(`🔔 Creating welcome notification for user ${userId}`);
    // Implementation would create notification record
  }
}

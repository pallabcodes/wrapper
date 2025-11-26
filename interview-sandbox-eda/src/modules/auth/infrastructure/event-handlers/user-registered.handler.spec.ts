import { Test, TestingModule } from '@nestjs/testing';
import { UserRegisteredHandler } from './user-registered.handler';
import { UserRegisteredEvent } from '../../../../events/auth/user-registered.event';

describe('UserRegisteredHandler (EDA Event Handler)', () => {
  let handler: UserRegisteredHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserRegisteredHandler],
    }).compile();

    handler = module.get<UserRegisteredHandler>(UserRegisteredHandler);
  });

  describe('handleUserRegistered', () => {
    it('should handle user registration event', async () => {
      const event = new UserRegisteredEvent(
        'user-123',
        'john.doe@example.com',
        'John Doe'
      );

      // Spy on console.log to verify logging
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await handler.handleUserRegistered(event);

      // Verify logging
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🎉 User registered: user-123 - john.doe@example.com')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('📧 Sending welcome email to john.doe@example.com for John Doe')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🔔 Creating welcome notification for user user-123')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('✅ User registration completed for: john.doe@example.com')
      );

      consoleSpy.mockRestore();
    });

    it('should handle errors gracefully', async () => {
      const event = new UserRegisteredEvent(
        'user-123',
        'john.doe@example.com',
        'John Doe'
      );

      // Mock console.error to verify error logging
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Force an error in the handler (simulate email service failure)
      const originalMethod = handler['sendWelcomeEmail'];
      handler['sendWelcomeEmail'] = jest.fn().mockRejectedValue(new Error('Email service down'));

      await handler.handleUserRegistered(event);

      // Should log the error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌ Error handling user registration:'),
        expect.any(Error)
      );

      // Restore original method
      handler['sendWelcomeEmail'] = originalMethod;
      consoleErrorSpy.mockRestore();
    });
  });

  describe('private methods', () => {
    it('should call sendWelcomeEmail with correct parameters', async () => {
      const sendEmailSpy = jest.spyOn(handler as any, 'sendWelcomeEmail');
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await (handler as any).sendWelcomeEmail('test@example.com', 'Test User');

      expect(sendEmailSpy).toHaveBeenCalledWith('test@example.com', 'Test User');
      expect(consoleSpy).toHaveBeenCalledWith(
        '📧 Sending welcome email to test@example.com for Test User'
      );

      consoleSpy.mockRestore();
    });

    it('should call createWelcomeNotification with correct parameters', async () => {
      const createNotificationSpy = jest.spyOn(handler as any, 'createWelcomeNotification');
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await (handler as any).createWelcomeNotification('user-123', 'Test User');

      expect(createNotificationSpy).toHaveBeenCalledWith('user-123', 'Test User');
      expect(consoleSpy).toHaveBeenCalledWith(
        '🔔 Creating welcome notification for user user-123'
      );

      consoleSpy.mockRestore();
    });
  });
});

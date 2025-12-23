import { UserAggregate } from './user.aggregate';
import { Email } from '../value-objects/email.vo';
import { Password } from '../value-objects/password.vo';

describe('UserAggregate (EDA Domain)', () => {
  const validEmail = Email.create('test@example.com');
  let validPassword: Password;

  beforeEach(async () => {
    validPassword = Password.create('ValidPass123');
  });

  describe('register', () => {
    it('should create a user aggregate and publish UserRegisteredEvent', async () => {
      const userId = 'user-123';
      const user = await UserAggregate.register(userId, validEmail, 'John Doe', validPassword, 'USER');

      expect(user.getId()).toBe(userId);
      expect(user.email.getValue()).toBe('test@example.com');
      expect(user.name).toBe('John Doe');
      expect(user.role).toBe('USER');

      // Check domain events
      const domainEvents = user.getDomainEvents();
      expect(domainEvents).toHaveLength(1);
      expect(domainEvents[0].eventType).toBe('UserRegisteredEvent');
      expect(domainEvents[0].aggregateId).toBe(userId);
    });

    it('should clear domain events after clearing', async () => {
      const user = await UserAggregate.register('user-123', validEmail, 'John Doe', validPassword);

      expect(user.getDomainEvents()).toHaveLength(1);

      user.clearDomainEvents();
      expect(user.getDomainEvents()).toHaveLength(0);
    });
  });

  describe('business logic', () => {
    let user: UserAggregate;

    beforeEach(async () => {
      user = await UserAggregate.register('user-123', validEmail, 'John Doe', validPassword, 'USER');
      user.clearDomainEvents(); // Clear initial events
    });

    describe('verifyEmail', () => {
      it('should verify email and publish UserEmailVerifiedEvent', () => {
        user.verifyEmail();

        expect(user.isEmailVerified).toBe(true);

        const domainEvents = user.getDomainEvents();
        expect(domainEvents).toHaveLength(1);
        expect(domainEvents[0].eventType).toBe('UserEmailVerifiedEvent');
        expect(domainEvents[0].aggregateId).toBe('user-123');
      });

      it('should throw error if email is already verified', () => {
        user.verifyEmail(); // First verification
        user.clearDomainEvents();

        expect(() => user.verifyEmail()).toThrow('Email is already verified');
      });
    });

    describe('canAccessResource', () => {
      it('should allow admin to access any resource', async () => {
        const adminUser = await UserAggregate.register('admin-123', validEmail, 'Admin', validPassword, 'ADMIN');
        expect(adminUser.canAccessResource('some-user-id')).toBe(true);
      });

      it('should allow user to access their own resource', () => {
        expect(user.canAccessResource('user-123')).toBe(true);
      });

      it('should deny user access to other resources', () => {
        expect(user.canAccessResource('other-user-id')).toBe(false);
      });
    });
  });

  describe('event-driven behavior', () => {
    it('should maintain domain event history', async () => {
      const user = await UserAggregate.register('user-123', validEmail, 'John', validPassword);

      // Should have registration event
      expect(user.getDomainEvents()).toHaveLength(1);

      // Verify email - adds another event
      user.verifyEmail();
      expect(user.getDomainEvents()).toHaveLength(2);

      // Clear events
      user.clearDomainEvents();
      expect(user.getDomainEvents()).toHaveLength(0);
    });

    it('should publish events with correct metadata', async () => {
      const user = await UserAggregate.register('user-123', validEmail, 'John', validPassword);

      const events = user.getDomainEvents();
      const registrationEvent = events[0];

      expect(registrationEvent).toHaveProperty('eventType');
      expect(registrationEvent).toHaveProperty('aggregateId');
      expect(registrationEvent).toHaveProperty('timestamp');
      expect(registrationEvent).toHaveProperty('eventVersion');
    });
  });
});

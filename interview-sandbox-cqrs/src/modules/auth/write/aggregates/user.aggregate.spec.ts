import { UserAggregate } from './user.aggregate';
import { Email } from '../value-objects/email.vo';
import { Password } from '../value-objects/password.vo';

describe('UserAggregate (CQRS Write Model)', () => {
  const validEmail = Email.create('test@example.com');
  let validPassword: Password;

  beforeEach(async () => {
    validPassword = Password.create('ValidPass123');
  });

  describe('create', () => {
    it('should create a user aggregate with valid data', () => {
      const userId = 'user-123';
      const user = UserAggregate.create(userId, validEmail, 'John Doe', validPassword, 'USER');

      expect(user.getId()).toBe(userId);
      expect(user.email.getValue()).toBe('test@example.com');
      expect(user.name).toBe('John Doe');
      expect(user.role).toBe('USER');
      expect(user.isEmailVerified).toBe(false);
    });

    it('should generate UserCreatedEvent', () => {
      const user = UserAggregate.create('user-123', validEmail, 'John Doe', validPassword);

      const events = user.getUncommittedChanges();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('UserCreatedEvent');
      expect(events[0].aggregateId).toBe('user-123');
      expect(events[0].email).toBe('test@example.com');
    });

    it('should default to USER role', () => {
      const user = UserAggregate.create('user-123', validEmail, 'John Doe', validPassword);
      expect(user.role).toBe('USER');
    });
  });

  describe('business logic', () => {
    let user: UserAggregate;

    beforeEach(() => {
      user = UserAggregate.create('user-123', validEmail, 'John Doe', validPassword, 'USER');
      user.markChangesAsCommitted(); // Clear initial events
    });

    describe('changeEmail', () => {
      it('should change email and generate event', () => {
        const newEmail = Email.create('new@example.com');
        user.changeEmail(newEmail);

        expect(user.email.getValue()).toBe('new@example.com');

        const events = user.getUncommittedChanges();
        expect(events).toHaveLength(1);
        expect(events[0].eventType).toBe('UserEmailChangedEvent');
        expect(events[0].newEmail).toBe('new@example.com');
        expect(events[0].oldEmail).toBe('test@example.com');
      });

      it('should not generate event if email is same', () => {
        user.changeEmail(validEmail);

        const events = user.getUncommittedChanges();
        expect(events).toHaveLength(0);
      });
    });

    describe('verifyPassword', () => {
      it('should verify correct password', async () => {
        const isValid = await user.verifyPassword(validPassword);
        expect(isValid).toBe(true);
      });

      it('should reject incorrect password', async () => {
        const wrongPassword = Password.create('WrongPass456');
        const isValid = await user.verifyPassword(wrongPassword);
        expect(isValid).toBe(false);
      });
    });

    describe('canAccessResource', () => {
      it('should allow admin to access any resource', () => {
        const adminUser = UserAggregate.create('admin-123', validEmail, 'Admin', validPassword, 'ADMIN');
        expect(adminUser.canAccessResource('some-user-id')).toBe(true);
      });

      it('should allow user to access their own resource', () => {
        expect(user.canAccessResource('user-123')).toBe(true);
      });

      it('should deny user access to other resources', () => {
        expect(user.canAccessResource('other-user-id')).toBe(false);
      });
    });

    describe('hasRole', () => {
      it('should return true for matching role', () => {
        expect(user.hasRole('USER')).toBe(true);
      });

      it('should return false for non-matching role', () => {
        expect(user.hasRole('ADMIN')).toBe(false);
      });
    });
  });

  describe('event sourcing', () => {
    it('should track uncommitted changes', () => {
      const user = UserAggregate.create('user-123', validEmail, 'John', validPassword);
      expect(user.getUncommittedChanges()).toHaveLength(1);

      user.markChangesAsCommitted();
      expect(user.getUncommittedChanges()).toHaveLength(0);
    });

    it('should load from event history', () => {
      const user = UserAggregate.create('user-123', validEmail, 'John', validPassword);
      user.markChangesAsCommitted();

      // Simulate loading from event store
      user.loadFromHistory([]);

      // User state should be preserved
      expect(user.getId()).toBe('user-123');
    });
  });
});

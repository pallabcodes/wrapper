import { User } from './user.entity';
import { Email } from '../value-objects/email.vo';
import { Password } from '../value-objects/password.vo';

describe('User Entity (Hexagonal Architecture)', () => {
  const validEmail = Email.create('test@example.com');
  let validPassword: Password;

  beforeEach(async () => {
    validPassword = Password.create('ValidPass123');
  });

  describe('create', () => {
    it('should create a user entity with valid data', async () => {
      const userId = 'user-123';
      const user = await User.create(userId, validEmail, 'John Doe', validPassword, 'USER');

      expect(user.id).toBe(userId);
      expect(user.email.getValue()).toBe('test@example.com');
      expect(user.name).toBe('John Doe');
      expect(user.role).toBe('USER');
      expect(user.isEmailVerified).toBe(false);
    });

    it('should hash password during creation', async () => {
      const user = await User.create('user-123', validEmail, 'John', validPassword);
      expect(user.passwordHash).not.toBe('ValidPass123');
      expect(typeof user.passwordHash).toBe('string');
      expect(user.passwordHash.length).toBeGreaterThan(0);
    });
  });

  describe('business logic', () => {
    let user: User;

    beforeEach(async () => {
      user = await User.create('user-123', validEmail, 'John Doe', validPassword, 'USER');
    });

    describe('verifyEmail', () => {
      it('should verify email successfully', () => {
        user.verifyEmail();
        expect(user.isEmailVerified).toBe(true);
      });

      it('should throw error if email is already verified', () => {
        user.verifyEmail(); // First verification
        expect(() => user.verifyEmail()).toThrow('Email is already verified');
      });
    });

    describe('changeEmail', () => {
      it('should change email when not verified', () => {
        const newEmail = Email.create('new@example.com');
        user.changeEmail(newEmail);
        expect(user.email.getValue()).toBe('new@example.com');
      });

      it('should throw error when trying to change verified email', () => {
        user.verifyEmail();
        const newEmail = Email.create('new@example.com');
        expect(() => user.changeEmail(newEmail)).toThrow('Cannot change email after verification');
      });
    });

    describe('changePassword', () => {
      it('should change password', async () => {
        const newPassword = Password.create('NewValidPass456');
        await user.changePassword(newPassword);
        expect(user.passwordHash).not.toBe('ValidPass123');
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
        const adminUser = new User('admin-123', validEmail, 'Admin', 'hash', 'ADMIN', false);
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

  describe('entity identity and equality', () => {
    it('should have unique identity', async () => {
      const user1 = await User.create('user-1', validEmail, 'John', validPassword);
      const user2 = await User.create('user-2', validEmail, 'Jane', validPassword);

      expect(user1.id).toBe('user-1');
      expect(user2.id).toBe('user-2');
      expect(user1.id).not.toBe(user2.id);
    });

    it('should maintain entity state', async () => {
      const user = await User.create('user-123', validEmail, 'John', validPassword);

      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
      expect(user.createdAt.getTime()).toBeLessThanOrEqual(user.updatedAt.getTime());
    });
  });
});

import { User } from './user.entity';
import { Email } from '../value-objects/email.vo';
import type { AuthConfig } from '../../infrastructure/config/auth.config';

describe('User Entity', () => {
  const validEmail = Email.create('test@example.com');
  const authConfig: AuthConfig = {
    JWT: { SECRET: 'unused', ACCESS_TOKEN_EXPIRATION: '15m', REFRESH_TOKEN_EXPIRATION: '7d' },
    BCRYPT: { SALT_ROUNDS: 4 },
    PASSWORD: { MIN_LENGTH: 8, REQUIRE_UPPERCASE: true, REQUIRE_LOWERCASE: true, REQUIRE_NUMBER: true },
  };
  const validPassword = 'ValidPass123!';

  describe('create', () => {
    it('should create a user with valid data', async () => {
      const user = await User.create(validEmail, 'John Doe', validPassword, authConfig, 'USER');

      expect(user.id).toBeDefined();
      expect(user.email.getValue()).toBe('test@example.com');
      expect(user.name).toBe('John Doe');
      expect(user.role).toBe('USER');
      expect(user.isEmailVerified).toBe(false);
    });

    it('should default to USER role', async () => {
      const user = await User.create(validEmail, 'John Doe', validPassword, authConfig);
      expect(user.role).toBe('USER');
    });
  });

  describe('reconstitute', () => {
    it('should recreate user from persisted data', () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');

      const user = User.reconstitute({
        id: 'user-123',
        email: validEmail,
        name: 'John Doe',
        role: 'ADMIN',
        passwordHash: 'hashed-password',
        isEmailVerified: true,
        isActive: true,
        createdAt,
        updatedAt,
      });

      expect(user.id).toBe('user-123');
      expect(user.email.getValue()).toBe('test@example.com');
      expect(user.name).toBe('John Doe');
      expect(user.role).toBe('ADMIN');
      expect(user.passwordHash).toBe('hashed-password');
      expect(user.isEmailVerified).toBe(true);
      expect(user.createdAt).toBe(createdAt);
      expect(user.updatedAt).toBe(updatedAt);
    });
  });

  describe('business logic', () => {
    let user: User;
    let adminUser: User;

    beforeEach(async () => {
      user = await User.create(validEmail, 'John Doe', validPassword, authConfig, 'USER');
      const adminEmail = Email.create('admin@example.com');
      adminUser = await User.create(adminEmail, 'Admin User', validPassword, authConfig, 'ADMIN');
    });

    describe('canAccessResource', () => {
      it('should allow admin to access any resource', () => {
        expect(adminUser.canAccessResource('some-user-id')).toBe(true);
      });

      it('should allow user to access their own resource', () => {
        expect(user.canAccessResource(user.id)).toBe(true);
      });

      it('should deny user access to other resources', () => {
        expect(user.canAccessResource('other-user-id')).toBe(false);
      });
    });

    describe('hasRole', () => {
      it('should return true for matching role', () => {
        expect(user.hasRole('USER')).toBe(true);
        expect(adminUser.hasRole('ADMIN')).toBe(true);
      });

      it('should return false for non-matching role', () => {
        expect(user.hasRole('ADMIN')).toBe(false);
        expect(adminUser.hasRole('USER')).toBe(false);
      });
    });

    describe('hasAnyRole', () => {
      it('should return true when user has one of the roles', () => {
        expect(user.hasAnyRole(['USER', 'ADMIN'])).toBe(true);
        expect(adminUser.hasAnyRole(['USER', 'ADMIN'])).toBe(true);
      });

      it('should return false when user has none of the roles', () => {
        expect(user.hasAnyRole(['ADMIN', 'MODERATOR'])).toBe(false);
      });
    });
  });

  describe('verifyEmail', () => {
    it('should mark email as verified and update timestamp', async () => {
      const user = await User.create(validEmail, 'John Doe', validPassword, authConfig, 'USER');
      const originalUpdatedAt = user.updatedAt;

      const verifiedUser = await user.verifyEmail();

      expect(verifiedUser.isEmailVerified).toBe(true);
      expect(verifiedUser.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
      expect(verifiedUser.id).toBe(user.id);
      expect(verifiedUser.email).toBe(user.email);
      expect(verifiedUser.name).toBe(user.name);
    });

    it('should return new instance (immutability)', async () => {
      const user = await User.create(validEmail, 'John Doe', validPassword, authConfig, 'USER');
      const verifiedUser = await user.verifyEmail();

      expect(verifiedUser).not.toBe(user);
      expect(user.isEmailVerified).toBe(false); // original unchanged
      expect(verifiedUser.isEmailVerified).toBe(true);
    });
  });
});

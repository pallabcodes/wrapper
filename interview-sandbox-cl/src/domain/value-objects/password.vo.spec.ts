import { Password } from './password.vo';
import type { AuthConfig } from '../../infrastructure/config/auth.config';

const authConfig: AuthConfig = {
  JWT: { SECRET: 'unused', ACCESS_TOKEN_EXPIRATION: '15m', REFRESH_TOKEN_EXPIRATION: '7d' },
  BCRYPT: { SALT_ROUNDS: 4 },
  PASSWORD: { MIN_LENGTH: 8, REQUIRE_UPPERCASE: true, REQUIRE_LOWERCASE: true, REQUIRE_NUMBER: true },
};

describe('Password Value Object', () => {
  describe('create', () => {
    it('should create a valid password', () => {
      const password = Password.create('ValidPass123', authConfig);
      expect(password).toBeDefined();
    });

    it('should throw error for password too short', () => {
      expect(() => Password.create('123', authConfig)).toThrow('Password must be at least 8 characters long');
    });

    it('should throw error for password without uppercase', () => {
      expect(() => Password.create('validpass123', authConfig)).toThrow('Password must contain at least one uppercase letter');
    });

    it('should throw error for password without lowercase', () => {
      expect(() => Password.create('VALIDPASS123', authConfig)).toThrow('Password must contain at least one lowercase letter');
    });

    it('should throw error for password without number', () => {
      expect(() => Password.create('ValidPass', authConfig)).toThrow('Password must contain at least one number');
    });
  });

  describe('hash', () => {
    it('should hash a password asynchronously', async () => {
      const password = Password.create('ValidPass123', authConfig);
      const hash = await password.hash();
      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
      expect(hash.startsWith('$2')).toBe(true); // bcrypt hash format
    });

    it('should return existing hash for fromHash passwords', async () => {
      const existingHash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewfLkIwF/HTQXvGi';
      const password = Password.fromHash(existingHash, authConfig);
      const result = await password.hash();
      expect(result).toBe(existingHash);
    });
  });

  describe('compare', () => {
    it('should verify correct password', async () => {
      const plainPassword = Password.create('ValidPass123', authConfig);
      const hashedPassword = await plainPassword.hash();

      const passwordToVerify = Password.fromHash(hashedPassword, authConfig);
      const isValid = await passwordToVerify.compare('ValidPass123');
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = Password.create('ValidPass123', authConfig);
      const hashedPassword = await password.hash();

      const wrongPassword = Password.create('WrongPass456', authConfig);
      const passwordToVerify = Password.fromHash(hashedPassword, authConfig);
      const isValid = await passwordToVerify.compare(wrongPassword.toString());
      expect(isValid).toBe(false);
    });
  });
});

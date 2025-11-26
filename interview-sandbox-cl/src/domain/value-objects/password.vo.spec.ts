import { Password } from './password.vo';

describe('Password Value Object', () => {
  describe('create', () => {
    it('should create a valid password', () => {
      const password = Password.create('ValidPass123');
      expect(password).toBeDefined();
    });

    it('should throw error for password too short', () => {
      expect(() => Password.create('123')).toThrow('Password must be at least 8 characters long');
    });

    it('should throw error for password without uppercase', () => {
      expect(() => Password.create('validpass123')).toThrow('Password must contain at least one uppercase letter');
    });

    it('should throw error for password without lowercase', () => {
      expect(() => Password.create('VALIDPASS123')).toThrow('Password must contain at least one lowercase letter');
    });

    it('should throw error for password without number', () => {
      expect(() => Password.create('ValidPass')).toThrow('Password must contain at least one number');
    });
  });

  describe('hash', () => {
    it('should hash a password asynchronously', async () => {
      const password = Password.create('ValidPass123');
      const hash = await password.hash();
      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
      expect(hash.startsWith('$2')).toBe(true); // bcrypt hash format
    });

    it('should return existing hash for fromHash passwords', async () => {
      const existingHash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewfLkIwF/HTQXvGi';
      const password = Password.fromHash(existingHash);
      const result = await password.hash();
      expect(result).toBe(existingHash);
    });
  });

  describe('compare', () => {
    it('should verify correct password', async () => {
      const plainPassword = Password.create('ValidPass123');
      const hashedPassword = await plainPassword.hash();

      const passwordToVerify = Password.fromHash(hashedPassword);
      const isValid = await plainPassword.compare(hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = Password.create('ValidPass123');
      const hashedPassword = await password.hash();

      const wrongPassword = Password.create('WrongPass456');
      const isValid = await wrongPassword.compare(hashedPassword);
      expect(isValid).toBe(false);
    });
  });
});

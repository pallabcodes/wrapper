import { Email } from './email.vo';

describe('Email Value Object', () => {
  describe('create', () => {
    it('should create a valid email', () => {
      const email = Email.create('test@example.com');
      expect(email.getValue()).toBe('test@example.com');
    });

    it('should throw error for empty email', () => {
      expect(() => Email.create('')).toThrow('Email cannot be empty');
    });

    it('should throw error for invalid email format', () => {
      expect(() => Email.create('invalid-email')).toThrow('Invalid email format');
      expect(() => Email.create('test@')).toThrow('Invalid email format');
    });

    it('should throw error for emails with invalid characters', () => {
      expect(() => Email.create('test<script>@example.com')).toThrow('Invalid characters in email');
    });

    it('should throw error for too long emails', () => {
      const longEmail = 'a'.repeat(255) + '@example.com';
      expect(() => Email.create(longEmail)).toThrow('Email is too long');
    });
  });

  describe('equals', () => {
    it('should return true for same emails', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('test@example.com');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return false for different emails', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('other@example.com');
      expect(email1.equals(email2)).toBe(false);
    });
  });
});

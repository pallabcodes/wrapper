import { Test, TestingModule } from '@nestjs/testing';
import { MemoryRateLimitStorage } from './memory-rate-limit.storage';
import { RateLimitInfo } from './rate-limit.types';

describe('MemoryRateLimitStorage', () => {
  let storage: MemoryRateLimitStorage;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MemoryRateLimitStorage],
    }).compile();

    storage = module.get<MemoryRateLimitStorage>(MemoryRateLimitStorage);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('increment', () => {
    it('should create new entry for first request', async () => {
      const result = await storage.increment('test-key', 60000);

      expect(result).toEqual({
        limit: 1000, // default limit
        remaining: 999,
        resetTime: expect.any(Number),
      });
    });

    it('should increment existing entry', async () => {
      await storage.increment('test-key', 60000);
      const result = await storage.increment('test-key', 60000);

      expect(result.remaining).toBe(998);
    });

    it('should reset window when time has passed', async () => {
      // First request
      await storage.increment('test-key', 1000);
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Second request should reset the window
      const result = await storage.increment('test-key', 1000);

      expect(result.remaining).toBe(999); // Should be reset
    });
  });

  describe('get', () => {
    it('should return null for non-existent key', async () => {
      const result = await storage.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should return null for expired entry', async () => {
      await storage.increment('test-key', 1000);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      const result = await storage.get('test-key');
      expect(result).toBeNull();
    });

    it('should return valid entry', async () => {
      await storage.increment('test-key', 60000);
      const result = await storage.get('test-key');

      expect(result).toEqual({
        limit: 1000,
        remaining: 999,
        resetTime: expect.any(Number),
      });
    });
  });

  describe('set', () => {
    it('should store rate limit info', async () => {
      const info: RateLimitInfo = {
        limit: 100,
        remaining: 50,
        resetTime: Date.now() + 60000,
      };

      await storage.set('test-key', info, 60000);
      const result = await storage.get('test-key');

      expect(result).toEqual(info);
    });
  });

  describe('reset', () => {
    it('should remove key from storage', async () => {
      await storage.increment('test-key', 60000);
      await storage.reset('test-key');
      
      const result = await storage.get('test-key');
      expect(result).toBeNull();
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { RateLimitGuard } from './rate-limit.guard';
import { RateLimitStorage, RateLimitInfo } from './rate-limit.types';
import { RATE_LIMIT_KEY } from './rate-limit.decorator';

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;
  let storage: jest.Mocked<RateLimitStorage>;
  let reflector: jest.Mocked<Reflector>;

  const mockRequest = {
    ip: '127.0.0.1',
    connection: { remoteAddress: '127.0.0.1' },
    user: { id: 'user123' },
  } as { ip: string; connection: { remoteAddress: string }; user?: { id?: string } };

  const mockResponse = {
    setHeader: jest.fn(),
  };

  const mockContext = {
    switchToHttp: () => ({
      getRequest: () => mockRequest,
      getResponse: () => mockResponse,
    }),
    getHandler: () => ({}),
  } as ExecutionContext;

  beforeEach(async () => {
    const mockStorage: jest.Mocked<RateLimitStorage> = {
      get: jest.fn(),
      set: jest.fn(),
      increment: jest.fn(),
      reset: jest.fn(),
    };

    const mockReflector = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitGuard,
        { provide: RateLimitStorage, useValue: mockStorage },
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    guard = module.get<RateLimitGuard>(RateLimitGuard);
    storage = module.get(RateLimitStorage);
    reflector = module.get(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should allow request when no rate limit is configured', async () => {
    reflector.get.mockReturnValue(undefined);

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(true);
    expect(storage.increment).not.toHaveBeenCalled();
  });

  it('should allow request when under rate limit', async () => {
    const options = { max: 10, windowMs: 60000 };
    reflector.get.mockReturnValue(options);

    const rateLimitInfo: RateLimitInfo = {
      limit: 10,
      remaining: 5,
      resetTime: Date.now() + 60000,
    };
    storage.increment.mockResolvedValue(rateLimitInfo);

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(true);
    expect(storage.increment).toHaveBeenCalledWith('rate_limit:127.0.0.1', 60000000);
    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 10);
    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 5);
  });

  it('should block request when rate limit is exceeded', async () => {
    const options = { max: 10, windowMs: 60000 };
    reflector.get.mockReturnValue(options);

    const rateLimitInfo: RateLimitInfo = {
      limit: 10,
      remaining: -1,
      resetTime: Date.now() + 60000,
    };
    storage.increment.mockResolvedValue(rateLimitInfo);

    await expect(guard.canActivate(mockContext)).rejects.toThrow(HttpException);

    expect(mockResponse.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(String));
  });

  it('should use custom key generator', async () => {
    const options = {
      max: 10,
      windowMs: 60000,
      keyGenerator: (req: { user?: { id?: string } }) => `user:${req.user?.id}`,
    };
    reflector.get.mockReturnValue(options);

    const rateLimitInfo: RateLimitInfo = {
      limit: 10,
      remaining: 5,
      resetTime: Date.now() + 60000,
    };
    storage.increment.mockResolvedValue(rateLimitInfo);

    await guard.canActivate(mockContext);

    expect(storage.increment).toHaveBeenCalledWith('user:user123', 60000000);
  });

  it('should skip rate limiting when skip condition is met', async () => {
    const options = {
      max: 10,
      windowMs: 60000,
      skip: (req: { user?: { id?: string } }) => req.user?.id === 'admin',
    };
    reflector.get.mockReturnValue(options);

    const adminRequest = { ...mockRequest, user: { id: 'admin' } };
    const adminContext = {
      ...mockContext,
      switchToHttp: () => ({
        getRequest: () => adminRequest,
        getResponse: () => mockResponse,
      }),
    } as ExecutionContext;

    const result = await guard.canActivate(adminContext);

    expect(result).toBe(true);
    expect(storage.increment).not.toHaveBeenCalled();
  });

  it('should handle storage errors gracefully', async () => {
    const options = { max: 10, windowMs: 60000 };
    reflector.get.mockReturnValue(options);
    storage.increment.mockRejectedValue(new Error('Storage error'));

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(true); // Should allow request to proceed
  });

  it('should set custom error message and status code', async () => {
    const options = {
      max: 10,
      windowMs: 60000,
      message: 'Custom rate limit message',
      statusCode: 429,
    };
    reflector.get.mockReturnValue(options);

    const rateLimitInfo: RateLimitInfo = {
      limit: 10,
      remaining: -1,
      resetTime: Date.now() + 60000,
    };
    storage.increment.mockResolvedValue(rateLimitInfo);

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      expect.objectContaining({
        message: 'Custom rate limit message',
        statusCode: 429,
      }),
    );
  });
});

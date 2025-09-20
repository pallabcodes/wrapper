import { SetMetadata } from '@nestjs/common';

export const RETRY_KEY = 'retry';

export interface RetryOptions {
  maxAttempts?: number;
  backoffStrategy?: 'fixed' | 'exponential' | 'linear';
  baseDelay?: number;
  maxDelay?: number;
}

export function Retry(options: RetryOptions = {}) {
  return SetMetadata(RETRY_KEY, {
    maxAttempts: 3,
    backoffStrategy: 'exponential',
    baseDelay: 1000,
    maxDelay: 10000,
    ...options,
  });
}
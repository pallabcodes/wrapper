import { SetMetadata } from '@nestjs/common';

export const TIMEOUT_KEY = 'timeout';

export interface TimeoutOptions {
  timeout?: number;
  serviceTimeout?: Record<string, number>;
}

export function Timeout(options: TimeoutOptions = {}) {
  return SetMetadata(TIMEOUT_KEY, {
    timeout: 5000,
    serviceTimeout: {},
    ...options,
  });
}
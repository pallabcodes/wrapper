import { SetMetadata } from '@nestjs/common';

export const CHAOS_OPTIONS = 'authx:chaos_options';

export interface ChaosOptions {
  probability?: number; // 0..1
  delayMs?: number; // fixed delay when triggered
  errorRate?: number; // 0..1 separate error probability when triggered
}

export function Chaos(opts: ChaosOptions = {}) {
  return SetMetadata(CHAOS_OPTIONS, opts);
}



import { SetMetadata } from '@nestjs/common';
import type { ResilienceOptions } from './types';

export const RESILIENCE_OPTIONS = 'resilience:options';

export function Resilience(options: ResilienceOptions = {}): MethodDecorator & ClassDecorator {
  return SetMetadata(RESILIENCE_OPTIONS, options);
}



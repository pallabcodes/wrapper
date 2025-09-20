import { SetMetadata } from '@nestjs/common';

export const IDEMPOTENCY = 'idempotency:enabled';

export function Idempotency(): MethodDecorator & ClassDecorator {
  return SetMetadata(IDEMPOTENCY, true);
}



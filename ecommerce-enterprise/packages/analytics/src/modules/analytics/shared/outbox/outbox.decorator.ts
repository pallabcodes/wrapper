import { SetMetadata } from '@nestjs/common';

export const OUTBOX_EVENT = 'outbox:event-type';
export function Publish(type: string): MethodDecorator & ClassDecorator {
  return SetMetadata(OUTBOX_EVENT, type);
}



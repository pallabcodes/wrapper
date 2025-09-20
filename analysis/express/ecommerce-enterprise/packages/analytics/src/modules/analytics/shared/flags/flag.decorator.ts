import { SetMetadata } from '@nestjs/common';

export const FLAG_REQUIRED = 'flag:required';

export function Flag(name: string, defaultEnabled = false): MethodDecorator & ClassDecorator {
  return SetMetadata(FLAG_REQUIRED, { name, defaultEnabled });
}



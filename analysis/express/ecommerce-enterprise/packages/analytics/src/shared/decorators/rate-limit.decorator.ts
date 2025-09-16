import { SetMetadata } from '@nestjs/common';

export const RateLimit = (options: { ttl: number; limit: number }) =>
  SetMetadata('rateLimit', options);

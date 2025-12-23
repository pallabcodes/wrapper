import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT = 'analytics:rate_limit';
export const RateLimit = (tokensPerMinute: number) => SetMetadata(RATE_LIMIT, tokensPerMinute);



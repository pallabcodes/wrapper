import { SetMetadata } from '@nestjs/common';

export const QUERY_PROFILE_KEY = 'query_profile';

export interface QueryProfileOptions {
  enabled?: boolean;
  slowQueryThreshold?: number;
  logParameters?: boolean;
}

export const QueryProfile = (options?: QueryProfileOptions) => SetMetadata(QUERY_PROFILE_KEY, options || {});


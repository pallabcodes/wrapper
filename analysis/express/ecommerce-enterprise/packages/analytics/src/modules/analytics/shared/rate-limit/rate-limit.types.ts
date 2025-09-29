export interface RateLimitOptions {
  /** Maximum number of requests allowed */
  max: number;
  /** Time window in seconds */
  windowMs: number;
  /** Key generator function for rate limiting */
  keyGenerator?: (req: { method: string; url: string; ip?: string | undefined; headers: Record<string, string | string[] | undefined> }) => string;
  /** Skip successful requests from rate limit count */
  skipSuccessfulRequests?: boolean;
  /** Skip failed requests from rate limit count */
  skipFailedRequests?: boolean;
  /** Custom error message */
  message?: string;
  /** Custom error status code */
  statusCode?: number;
  /** Skip rate limiting for certain conditions */
  skip?: (req: { method: string; url: string; ip?: string | undefined; headers: Record<string, string | string[] | undefined> }) => boolean;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface RateLimitStorage {
  get(key: string): Promise<RateLimitInfo | null>;
  set(key: string, info: RateLimitInfo, ttlMs: number): Promise<void>;
  increment(key: string, windowMs: number): Promise<RateLimitInfo>;
  reset(key: string): Promise<void>;
}

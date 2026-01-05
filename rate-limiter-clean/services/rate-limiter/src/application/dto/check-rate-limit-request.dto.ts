/**
 * Application DTO: Check Rate Limit Request
 * 
 * Internal application-level request (not HTTP-specific)
 */
export class CheckRateLimitRequest {
    constructor(
        public readonly clientId: string,
        public readonly resource: string,
    ) { }
}
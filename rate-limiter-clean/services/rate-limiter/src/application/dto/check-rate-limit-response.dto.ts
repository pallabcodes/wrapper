/**
 * Application DTO: Check Rate Limit Response
 * 
 * Internal application-level response
 * Below class used in whichever use-case to indiccate the response of this type (class could be used as type and value)
 * N.B: right now it has same fields as Domain Result, but in future it can have different fields to match the Application response (or add more fields to the response)
 */
export class CheckRateLimitResponse {
    constructor(
        public readonly allowed: boolean,
        public readonly remaining: number,
        public readonly limit: number,
        public readonly resetAt: number,
        public readonly retryAfter?: number,
    ) { }
}

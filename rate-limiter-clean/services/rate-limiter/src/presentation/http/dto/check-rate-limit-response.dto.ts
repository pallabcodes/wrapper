/**
 * Presentation DTO: HTTP Response
 * 
 * Defines exactly what is sent over the wire via HTTP.
 * This decouples the HTTP contract from the Application DTO.
 * N.B: right now it has same fields as Application DTO, but in future it can have different fields to match the HTTP response (or add more fields to the response)
 */
export class CheckRateLimitHttpResponse {
    constructor(
        public readonly allowed: boolean,
        public readonly remaining: number,
        public readonly limit: number,
        public readonly resetAt: number,
        public readonly retryAfter?: number,
    ) { }

    static from(dto: {
        allowed: boolean;
        remaining: number;
        limit: number;
        resetAt: number;
        retryAfter?: number;
    }): CheckRateLimitHttpResponse {
        return new CheckRateLimitHttpResponse(
            dto.allowed,
            dto.remaining,
            dto.limit,
            dto.resetAt,
            dto.retryAfter,
        );
    }
}

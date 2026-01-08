
import { ErrorCode } from './error-codes';

export class DomainException extends Error {
    constructor(
        public readonly message: string,
        public readonly code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
        public readonly metadata?: Record<string, any>
    ) {
        super(message);
        this.name = 'DomainException';
        Object.setPrototypeOf(this, DomainException.prototype);
    }
}

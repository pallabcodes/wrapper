/**
 * Domain Exception
 * Thrown when domain rules are violated
 */
export class DomainException extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DomainException';
    }
}

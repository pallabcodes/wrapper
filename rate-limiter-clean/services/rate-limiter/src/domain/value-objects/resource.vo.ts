import { DomainException } from '../exceptions/domain.exception';

/**
 * Value Object: Resource
 * Immutable resource path identifier
 */
export class Resource {
    private constructor(private readonly path: string) { }

    static create(path: string): Resource {
        if (!path || path.trim().length === 0) {
            throw new DomainException('Resource path cannot be empty');
        }
        if (!path.startsWith('/')) {
            throw new DomainException('Resource path must start with /');
        }
        return new Resource(path);
    }

    getValue(): string {
        return this.path;
    }

    equals(other: Resource): boolean {
        return this.path === other.path;
    }
}

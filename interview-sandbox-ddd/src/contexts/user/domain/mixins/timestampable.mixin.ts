/**
 * Mixin Pattern Implementation
 * 
 * Demonstrates composition with mixins in TypeScript/NestJS
 * 
 * Mixins allow you to compose multiple behaviors into a class
 * without using inheritance, promoting composition over inheritance.
 */

/**
 * Timestampable Mixin
 * Adds createdAt and updatedAt properties
 */
export function Timestampable<TBase extends new (...args: any[]) => object>(
  Base: TBase,
) {
  return class extends Base {
    createdAt: Date;
    updatedAt: Date;

    constructor(...args: any[]) {
      super(...args);
      this.createdAt = new Date();
      this.updatedAt = new Date();
    }

    touch(): void {
      this.updatedAt = new Date();
    }
  };
}

/**
 * Soft Deletable Mixin
 * Adds deletedAt property for soft deletes
 */
export function SoftDeletable<TBase extends new (...args: any[]) => object>(
  Base: TBase,
) {
  return class extends Base {
    deletedAt: Date | null = null;

    softDelete(): void {
      this.deletedAt = new Date();
    }

    restore(): void {
      this.deletedAt = null;
    }

    isDeleted(): boolean {
      return this.deletedAt !== null;
    }
  };
}

/**
 * Auditable Mixin
 * Adds audit trail properties
 */
export function Auditable<TBase extends new (...args: any[]) => object>(
  Base: TBase,
) {
  return class extends Base {
    createdBy: string | null = null;
    updatedBy: string | null = null;

    setCreatedBy(userId: string): void {
      this.createdBy = userId;
    }

    setUpdatedBy(userId: string): void {
      this.updatedBy = userId;
    }
  };
}

/**
 * Example: Composing multiple mixins
 */
export class BaseEntity {
  id: string;

  constructor(id: string) {
    this.id = id;
  }
}

// Compose multiple mixins
export const TimestampableEntity = Timestampable(BaseEntity);
export const FullAuditEntity = Auditable(Timestampable(SoftDeletable(BaseEntity)));

/**
 * Usage example:
 * 
 * class User extends FullAuditEntity {
 *   email: string;
 *   
 *   constructor(id: string, email: string) {
 *     super(id);
 *     this.email = email;
 *   }
 * }
 * 
 * const user = new User('1', 'user@example.com');
 * user.setCreatedBy('admin');
 * user.touch();
 * user.softDelete();
 */


import { UserId } from '../../value-objects/user-id.vo';
import { Email } from '../../value-objects/email.vo';

/**
 * Query objects for CQRS read operations
 * Queries represent requests for data (optimized for reading)
 */

export abstract class UserQuery {
  constructor(public readonly correlationId?: string) {}
}

// Read Queries (Queries)
export class GetUserByIdQuery extends UserQuery {
  constructor(public readonly userId: UserId) {
    super();
  }
}

export class GetUserByEmailQuery extends UserQuery {
  constructor(public readonly email: Email) {
    super();
  }
}

export class GetUsersByRoleQuery extends UserQuery {
  constructor(
    public readonly role: string,
    public readonly pagination?: { page: number; limit: number }
  ) {
    super();
  }
}

export class GetActiveUsersQuery extends UserQuery {
  constructor(public readonly pagination?: { page: number; limit: number }) {
    super();
  }
}

export class GetRecentUsersQuery extends UserQuery {
  constructor(
    public readonly days: number,
    public readonly pagination?: { page: number; limit: number }
  ) {
    super();
  }
}

export class SearchUsersQuery extends UserQuery {
  constructor(
    public readonly searchTerm: string,
    public readonly filters?: {
      role?: string;
      isActive?: boolean;
      isEmailVerified?: boolean;
      createdAfter?: Date;
    },
    public readonly pagination?: { page: number; limit: number },
    public readonly sortBy?: { field: string; direction: 'asc' | 'desc' }
  ) {
    super();
  }
}
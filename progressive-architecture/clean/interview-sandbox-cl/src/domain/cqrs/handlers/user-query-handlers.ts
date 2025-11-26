import { Injectable } from '@nestjs/common';
import { User } from '../../entities/user.entity';
import {
  GetUserByIdQuery,
  GetUserByEmailQuery,
  GetUsersByRoleQuery,
  GetActiveUsersQuery,
  GetRecentUsersQuery,
  SearchUsersQuery
} from '../queries/user-queries';
import {
  ActiveUsersSpecification,
  UsersByRoleSpecification,
  UsersCreatedWithinLastDaysSpecification,
  EmailVerifiedUsersSpecification
} from '../../specifications/user-specifications';
import type { UserRepositoryPort } from '../../ports/output/user.repository.port';

/**
 * Query Handlers for CQRS read operations
 * Handle optimized data retrieval operations
 */

@Injectable()
export class GetUserByIdQueryHandler {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async execute(query: GetUserByIdQuery): Promise<User | null> {
    return await this.userRepository.findById(query.userId);
  }
}

@Injectable()
export class GetUserByEmailQueryHandler {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async execute(query: GetUserByEmailQuery): Promise<User | null> {
    return await this.userRepository.findByEmail(query.email);
  }
}

@Injectable()
export class GetUsersByRoleQueryHandler {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async execute(query: GetUsersByRoleQuery): Promise<User[]> {
    const specification = new UsersByRoleSpecification(query.role);
    return await this.userRepository.findMany(specification);
  }
}

@Injectable()
export class GetActiveUsersQueryHandler {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async execute(query: GetActiveUsersQuery): Promise<User[]> {
    return await this.userRepository.findActiveUsers();
  }
}

@Injectable()
export class GetRecentUsersQueryHandler {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async execute(query: GetRecentUsersQuery): Promise<User[]> {
    const specification = new UsersCreatedWithinLastDaysSpecification(query.days);
    return await this.userRepository.findMany(specification);
  }
}

@Injectable()
export class SearchUsersQueryHandler {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async execute(query: SearchUsersQuery): Promise<User[]> {
    // Build complex specification based on filters
    let specification: any = new ActiveUsersSpecification(); // Start with active users

    if (query.filters?.role) {
      const roleSpec = new UsersByRoleSpecification(query.filters.role);
      specification = specification.and(roleSpec);
    }

    if (query.filters?.isEmailVerified) {
      const verifiedSpec = new EmailVerifiedUsersSpecification();
      specification = specification.and(verifiedSpec);
    }

    // For search term, we would need a more complex specification
    // This is simplified for the example

    return await this.userRepository.findMany(specification);
  }
}
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetUserByIdQuery } from './get-user-by-id.query';
import { Inject } from '@nestjs/common';
import { READ_REPOSITORY_TOKEN } from '../../../../common/di/tokens';

export interface UserReadModel {
  id: string;
  email: string;
  name: string;
  role: string;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery> {
  constructor(
    @Inject(READ_REPOSITORY_TOKEN)
    private readonly readRepository: any,
  ) {}

  async execute(query: GetUserByIdQuery): Promise<UserReadModel | null> {
    // Query the read model (optimized for reads)
    return this.readRepository.findById(query.userId);
  }
}

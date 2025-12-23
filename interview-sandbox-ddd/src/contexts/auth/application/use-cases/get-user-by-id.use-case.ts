import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';


export interface GetUserByIdQuery {
  userId: string;
}

export interface UserDto {
  id: string;
  email: string;
  name: string;
  role: string;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class GetUserByIdUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) { }

  async execute(query: GetUserByIdQuery): Promise<UserDto | null> {
    try {
      const userAggregate = await this.userRepository.findById(query.userId);

      if (!userAggregate) {
        return null;
      }

      // Transform domain object to DTO (application concern)
      return {
        id: userAggregate.id,
        email: userAggregate.email.getValue(),
        name: userAggregate.name,
        role: userAggregate.role,
        isEmailVerified: userAggregate.isEmailVerified,
        createdAt: userAggregate.createdAt,
        updatedAt: userAggregate.updatedAt,
      };
    } catch (error) {
      console.error('Error in GetUserByIdUseCase:', error);
      throw error;
    }
  }
}

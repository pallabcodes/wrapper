import { Injectable, Inject } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/ports/output/user-repository.port';
import { IGetUserByIdUseCase } from '../../domain/ports/input/auth-use-cases.port';

@Injectable()
export class GetUserByIdUseCase implements IGetUserByIdUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string): Promise<User | null> {
    // Business logic could be added here (e.g., authorization checks)
    return this.userRepository.findById(userId);
  }
}

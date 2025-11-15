import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { User } from '@domain/entities/user.entity';
import type { UserRepositoryPort } from '@domain/ports/user.repository.port';
import { USER_REPOSITORY_PORT } from '@domain/ports/user.repository.port';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    return this.userRepository.update(id, updates);
  }
}


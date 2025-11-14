import { Injectable, Inject } from '@nestjs/common';
import { WRITE_REPOSITORY_TOKEN } from '../../../../../common/di/tokens';

/**
 * Write Repository Interface
 */
export interface IUserWriteRepository {
  save(user: any): Promise<void>;
  findById(id: string): Promise<any>;
  delete(id: string): Promise<void>;
}

/**
 * Write Repository Implementation
 * 
 * Demonstrates Symbol token injection in CQRS write side
 */
@Injectable()
export class SequelizeUserWriteRepository implements IUserWriteRepository {
  async save(user: any): Promise<void> {
    // Database save logic
    console.log('Saving user to write database:', user);
  }

  async findById(id: string): Promise<any> {
    // Database find logic
    return { id, email: 'user@example.com' };
  }

  async delete(id: string): Promise<void> {
    // Database delete logic
    console.log('Deleting user:', id);
  }
}

/**
 * Command Handler using Symbol-injected repository
 */
@Injectable()
export class RegisterUserCommandHandler {
  constructor(
    @Inject(WRITE_REPOSITORY_TOKEN) 
    private readonly userRepository: IUserWriteRepository,
  ) {}

  async handle(command: any): Promise<void> {
    const user = { id: '1', email: command.email };
    await this.userRepository.save(user);
  }
}


import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UserRepositoryPort, USER_REPOSITORY_PORT } from '@domain/ports/output/user.repository.port';
import { User } from '@domain/entities/user.entity';
import { Email } from '@domain/value-objects/email.vo';
import { UserModel } from '../models/user.model';

@Injectable()
export class SequelizeUserRepositoryAdapter implements UserRepositoryPort {
  constructor(
    @InjectModel(UserModel)
    private userModel: typeof UserModel,
  ) {}

  async findById(id: string): Promise<User | null> {
    const model = await this.userModel.findByPk(id);
    return model ? this.toDomain(model) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const model = await this.userModel.findOne({
      where: { email: email.getValue() },
    });
    return model ? this.toDomain(model) : null;
  }

  async save(user: User): Promise<User> {
    const model = await this.userModel.create({
      email: user.email.getValue(),
      name: user.name,
      passwordHash: user.passwordHash,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    } as any);
    return this.toDomain(model);
  }

  async update(user: User): Promise<User> {
    const model = await this.userModel.findByPk(user.id);
    if (!model) {
      throw new Error(`User with id ${user.id} not found`);
    }

    await model.update({
      email: user.email.getValue(),
      name: user.name,
      passwordHash: user.passwordHash,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    });

    return this.toDomain(model);
  }

  private toDomain(model: UserModel): User {
    return User.reconstitute(
      model.id.toString(),
      Email.create(model.email),
      model.name,
      model.role as 'USER' | 'ADMIN' | 'MODERATOR',
      model.passwordHash,
      model.isEmailVerified,
      model.createdAt,
      model.updatedAt,
    );
  }
}


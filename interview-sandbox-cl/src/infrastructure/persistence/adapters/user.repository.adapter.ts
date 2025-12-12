import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UserRepositoryPort } from '@domain/ports/output/user.repository.port';
import { User, UserProps } from '@domain/entities/user.entity';
import { Email } from '@domain/value-objects/email.vo';
import { UserNotFoundException } from '@domain/exceptions/user-not-found.exception';
import { UserModel } from '../models/user.model';
import type { Specification } from '@domain/specifications/specification';
import { Op } from 'sequelize';

@Injectable()
export class SequelizeUserRepositoryAdapter implements UserRepositoryPort {
  constructor(
    @InjectModel(UserModel)
    private readonly userModel: typeof UserModel,
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
      id: user.id,
      email: user.email.getValue(),
      name: user.name,
      passwordHash: user.passwordHash,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    } as any);

    return this.toDomain(model);
  }

  async update(user: User): Promise<User> {
    const [affectedRows] = await this.userModel.update(
      {
        email: user.email.getValue(),
        name: user.name,
        passwordHash: user.passwordHash,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive,
        updatedAt: user.updatedAt,
      },
      {
        where: { id: user.id },
        returning: true,
      },
    );

    if (affectedRows === 0) {
      throw new UserNotFoundException(user.id);
    }

    // Fetch the updated model
    const updatedModel = await this.userModel.findByPk(user.id);
    if (!updatedModel) {
      throw new UserNotFoundException(user.id);
    }

    return this.toDomain(updatedModel);
  }

  async delete(id: string): Promise<void> {
    const affectedRows = await this.userModel.destroy({
      where: { id },
    });

    if (affectedRows === 0) {
      throw new UserNotFoundException(id);
    }
  }

  private toDomain(model: UserModel): User {
    const props: UserProps = {
      id: model.id,
      email: Email.create(model.email),
      name: model.name,
      role: model.role,
      passwordHash: model.passwordHash,
      isEmailVerified: model.isEmailVerified,
      isActive: model.isActive,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };

    return User.reconstitute(props);
  }

  async findOne(spec: Specification<User>): Promise<User | null> {
    throw new Error('findOne by specification not implemented');
  }

  async findMany(spec: Specification<User>): Promise<User[]> {
    throw new Error('findMany by specification not implemented');
  }

  async count(spec: Specification<User>): Promise<number> {
    throw new Error('count by specification not implemented');
  }

  async exists(spec: Specification<User>): Promise<boolean> {
    throw new Error('exists by specification not implemented');
  }

  async findActiveUsers(): Promise<User[]> {
    const results = await this.userModel.findAll({ where: { isActive: true } });
    return results.map((m) => this.toDomain(m));
  }

  async findUsersByRole(role: string): Promise<User[]> {
    const results = await this.userModel.findAll({ where: { role } });
    return results.map((m) => this.toDomain(m));
  }

  async findRecentlyCreated(days: number): Promise<User[]> {
    const threshold = new Date(Date.now() - days * 86400000);
    const results = await this.userModel.findAll({
      where: {
        createdAt: {
          [Op.gte]: threshold,
        },
      },
    });
    return results.map((m) => this.toDomain(m));
  }

  async findUnverifiedUsers(): Promise<User[]> {
    const results = await this.userModel.findAll({ where: { isEmailVerified: false } });
    return results.map((m) => this.toDomain(m));
  }
}


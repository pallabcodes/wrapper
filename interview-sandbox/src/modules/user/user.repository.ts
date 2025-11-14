import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../../database/models/user.model';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  async findById(id: number): Promise<User | null> {
    return this.userModel.findByPk(id);
  }

  async update(id: number, updateData: Partial<User>): Promise<[number]> {
    return this.userModel.update(updateData, { where: { id } });
  }
}


import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { File } from '../../database/models/file.model';

@Injectable()
export class FileRepository {
  constructor(
    @InjectModel(File)
    private fileModel: typeof File,
  ) {}

  async create(fileData: {
    userId: number;
    filename: string;
    path: string;
    mimeType: string;
    size: number;
  }): Promise<File> {
    return this.fileModel.create(fileData as any);
  }

  async findByUserId(userId: number): Promise<File[]> {
    return this.fileModel.findAll({ where: { userId } });
  }

  async findById(id: number): Promise<File | null> {
    return this.fileModel.findByPk(id);
  }

  async delete(id: number): Promise<number> {
    return this.fileModel.destroy({ where: { id } });
  }
}


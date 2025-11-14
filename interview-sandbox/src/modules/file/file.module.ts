import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { FileRepository } from './file.repository';
import { File } from '../../database/models/file.model';
import { User } from '../../database/models/user.model';
import { FileResponseMapper } from './mappers/file-response.mapper';

@Module({
  imports: [SequelizeModule.forFeature([File, User])],
  controllers: [FileController],
  providers: [FileService, FileRepository, FileResponseMapper],
  exports: [FileService],
})
export class FileModule {}


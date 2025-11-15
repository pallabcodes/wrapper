import { Module, OnModuleInit } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CrudController } from './crud.controller';
import { CrudService } from './crud.service';
import { CrudRepository } from './crud.repository';
import { EntityRegistryService } from './entity-registry.service';
import { Student } from '../../database/models/student.model';
import { Course } from '../../database/models/course.model';

@Module({
  imports: [SequelizeModule.forFeature([Student, Course])],
  controllers: [CrudController],
  providers: [CrudService, CrudRepository, EntityRegistryService],
  exports: [CrudService, EntityRegistryService],
})
export class CrudModule implements OnModuleInit {
  constructor(private readonly entityRegistry: EntityRegistryService) {}

  onModuleInit() {
    // Register Student entity
    this.entityRegistry.register('students', {
      model: Student,
      searchFields: ['name', 'email', 'course'],
      defaultOrder: [['id', 'DESC']],
    });

    // Register Course entity
    this.entityRegistry.register('courses', {
      model: Course,
      searchFields: ['title', 'description', 'instructor'],
      defaultOrder: [['id', 'DESC']],
    });
  }
}


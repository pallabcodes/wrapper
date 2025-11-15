import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Model } from 'sequelize';
import { CrudRepository } from './crud.repository';

export interface CrudFindAllOptions {
  page?: number;
  limit?: number;
  search?: string;
  searchFields?: string[];
  where?: any;
  order?: [string, 'ASC' | 'DESC'][];
}

export interface CrudResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class CrudService {
  constructor(private readonly crudRepository: CrudRepository) {}

  /**
   * Get all records with pagination and search
   */
  async findAll<T extends Model>(
    model: typeof Model | any,
    options: CrudFindAllOptions = {},
  ): Promise<CrudResponse<T>> {
    const { page = 1, limit = 10 } = options;

    if (page < 1) {
      throw new BadRequestException('Page must be greater than 0');
    }

    if (limit < 1 || limit > 100) {
      throw new BadRequestException('Limit must be between 1 and 100');
    }

    const { rows, count } = await this.crudRepository.findAll<T>(model, options);

    const totalPages = Math.ceil(count / limit);

    return {
      data: rows,
      meta: {
        total: count,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Get one record by ID
   */
  async findOne<T extends Model>(model: typeof Model | any, id: number): Promise<T> {
    const record = await this.crudRepository.findById<T>(model, id);

    if (!record) {
      throw new NotFoundException(`Record with ID ${id} not found`);
    }

    return record;
  }

  /**
   * Create a new record
   */
  async create<T extends Model>(model: typeof Model | any, data: any): Promise<T> {
    try {
      return await this.crudRepository.create<T>(model, data);
    } catch (error: any) {
      if (error.name === 'SequelizeValidationError') {
        throw new BadRequestException(error.errors.map((e: any) => e.message).join(', '));
      }
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new BadRequestException('A record with this value already exists');
      }
      throw error;
    }
  }

  /**
   * Update a record by ID
   */
  async update(model: typeof Model | any, id: number, data: any): Promise<{ message: string; data: any }> {
    const record = await this.crudRepository.findById(model, id);

    if (!record) {
      throw new NotFoundException(`Record with ID ${id} not found`);
    }

    try {
      const [affectedRows] = await this.crudRepository.update(model, id, data);

      if (affectedRows === 0) {
        throw new NotFoundException(`Record with ID ${id} not found`);
      }

      const updatedRecord = await this.crudRepository.findById(model, id);

      return {
        message: 'Record updated successfully',
        data: updatedRecord,
      };
    } catch (error: any) {
      if (error.name === 'SequelizeValidationError') {
        throw new BadRequestException(error.errors.map((e: any) => e.message).join(', '));
      }
      throw error;
    }
  }

  /**
   * Delete a record by ID
   */
  async delete(model: typeof Model | any, id: number): Promise<{ message: string }> {
    const record = await this.crudRepository.findById(model, id);

    if (!record) {
      throw new NotFoundException(`Record with ID ${id} not found`);
    }

    const deletedCount = await this.crudRepository.delete(model, id);

    if (deletedCount === 0) {
      throw new NotFoundException(`Record with ID ${id} not found`);
    }

    return {
      message: 'Record deleted successfully',
    };
  }
}


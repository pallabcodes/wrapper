import { Injectable } from '@nestjs/common';
import { Model, FindOptions, WhereOptions, Op } from 'sequelize';

@Injectable()
export class CrudRepository {
  /**
   * Find all records with pagination and search
   */
  async findAll<T extends Model>(
    model: typeof Model | any,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      searchFields?: string[];
      where?: WhereOptions;
      order?: [string, 'ASC' | 'DESC'][];
    } = {},
  ): Promise<{ rows: T[]; count: number }> {
    const {
      page = 1,
      limit = 10,
      search = '',
      searchFields = [],
      where = {},
      order = [['id', 'DESC']],
    } = options;

    const offset = (page - 1) * limit;

    // Build search conditions
    const searchConditions: any[] = [];
    if (search && searchFields.length > 0) {
      searchFields.forEach((field) => {
        searchConditions.push({
          [field]: {
            [Op.iLike]: `%${search}%`,
          },
        });
      });
    }

    // Combine where conditions
    const finalWhere: WhereOptions = {
      ...where,
      ...(searchConditions.length > 0 && { [Op.or]: searchConditions }),
    };

    const findOptions: FindOptions = {
      where: finalWhere,
      limit,
      offset,
      order,
    };

    const { rows, count } = await (model as any).findAndCountAll(findOptions);

    return { rows: rows as T[], count };
  }

  /**
   * Find one record by ID
   */
  async findById<T extends Model>(model: typeof Model | any, id: number): Promise<T | null> {
    return (await (model as any).findByPk(id)) as T | null;
  }

  /**
   * Create a new record
   */
  async create<T extends Model>(model: typeof Model | any, data: any): Promise<T> {
    return (await (model as any).create(data)) as T;
  }

  /**
   * Update a record by ID
   */
  async update(model: typeof Model | any, id: number, data: any): Promise<[number]> {
    return (model as any).update(data, {
      where: { id },
    });
  }

  /**
   * Delete a record by ID
   */
  async delete(model: typeof Model | any, id: number): Promise<number> {
    return (model as any).destroy({
      where: { id },
    });
  }
}


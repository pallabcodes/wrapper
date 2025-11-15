import { Injectable } from '@nestjs/common';
import { Model } from 'sequelize';

export interface EntityConfig {
  model: typeof Model | any;
  searchFields?: string[];
  defaultOrder?: [string, 'ASC' | 'DESC'][];
}

@Injectable()
export class EntityRegistryService {
  private readonly registry = new Map<string, EntityConfig>();

  /**
   * Register an entity with its model and configuration
   */
  register(entityName: string, config: EntityConfig): void {
    this.registry.set(entityName.toLowerCase(), config);
  }

  /**
   * Get entity configuration by name
   */
  get(entityName: string): EntityConfig | null {
    return this.registry.get(entityName.toLowerCase()) || null;
  }

  /**
   * Check if entity is registered
   */
  has(entityName: string): boolean {
    return this.registry.has(entityName.toLowerCase());
  }

  /**
   * Get all registered entity names
   */
  getAllEntityNames(): string[] {
    return Array.from(this.registry.keys());
  }
}


// Main module
export * from './nest-orm.module';

// Services
export * from './services/multi-orm.service';
export * from './services/prisma.service';
export * from './services/drizzle.service';
export * from './services/typeorm.service';
export * from './services/cache.service';
export * from './services/performance.service';

// Interfaces and types
export * from './interfaces/orm-options.interface';

// Decorators
export * from './decorators/query.decorator';
export * from './decorators/orm.decorator';

// Constants
export const ORM_PROVIDERS = {
  PRISMA: 'prisma' as const,
  DRIZZLE: 'drizzle' as const,
  TYPEORM: 'typeorm' as const
} as const;

export const QUERY_TYPES = {
  SELECT: 'select' as const,
  INSERT: 'insert' as const,
  UPDATE: 'update' as const,
  DELETE: 'delete' as const,
  RAW: 'raw' as const
} as const;

export const ISOLATION_LEVELS = {
  READ_UNCOMMITTED: 'read-uncommitted' as const,
  READ_COMMITTED: 'read-committed' as const,
  REPEATABLE_READ: 'repeatable-read' as const,
  SERIALIZABLE: 'serializable' as const
} as const;

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { z } from 'zod';
import { AdvancedCachingService } from './advanced-caching.service';

export interface SchemaDefinition<T extends z.ZodSchema = z.ZodSchema> {
  name: string;
  schema: T;
  version: string;
  description?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  usageCount: number;
  lastUsed?: Date;
}

export interface SchemaComposition {
  name: string;
  baseSchema: string;
  transformations: Array<{
    name: string;
    transform: (schema: z.ZodSchema) => z.ZodSchema;
    condition?: (schema: z.ZodSchema) => boolean;
  }>;
  validations: Array<{
    name: string;
    validation: (schema: z.ZodSchema) => z.ZodSchema;
    condition?: (schema: z.ZodSchema) => boolean;
  }>;
}

export interface SchemaSearchOptions {
  tags?: string[];
  version?: string;
  isActive?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  usageCountMin?: number;
  usageCountMax?: number;
}

export interface SchemaUsageStats {
  totalSchemas: number;
  activeSchemas: number;
  mostUsedSchemas: Array<{ name: string; usageCount: number }>;
  recentlyUsedSchemas: Array<{ name: string; lastUsed: Date }>;
  schemaVersions: Record<string, number>;
}

@Injectable()
export class SchemaRegistryService implements OnModuleInit {
  private readonly logger = new Logger(SchemaRegistryService.name);
  
  private schemas = new Map<string, SchemaDefinition>();
  private schemaVersions = new Map<string, Map<string, SchemaDefinition>>();
  private schemaTags = new Map<string, Set<string>>();
  private schemaCompositions = new Map<string, SchemaComposition>();
  
  // Performance tracking
  private usageStats = new Map<string, {
    usageCount: number;
    lastUsed?: Date;
    averageValidationTime: number;
    errorRate: number;
  }>();

  constructor(
    private readonly cachingService: AdvancedCachingService
  ) {}

  async onModuleInit() {
    this.logger.log('Schema Registry Service initialized');
    await this.loadDefaultSchemas();
  }

  /**
   * Register a schema with type safety
   */
  register<T extends z.ZodSchema>(
    name: string,
    schema: T,
    options?: {
      version?: string;
      description?: string;
      tags?: string[];
      metadata?: Record<string, unknown>;
    }
  ): T {
    const version = options?.version || '1.0.0';
    const fullName = `${name}@${version}`;
    
    // Check if schema already exists
    if (this.schemas.has(fullName)) {
      this.logger.warn(`Schema '${fullName}' already exists, updating...`);
    }

    const schemaDefinition: SchemaDefinition<T> = {
      name,
      schema,
      version,
      description: options?.description,
      tags: options?.tags || [],
      metadata: options?.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      usageCount: 0,
    } as SchemaDefinition<T>;

    // Store schema
    this.schemas.set(fullName, schemaDefinition);
    
    // Store version
    if (!this.schemaVersions.has(name)) {
      this.schemaVersions.set(name, new Map());
    }
    this.schemaVersions.get(name)!.set(version, schemaDefinition);
    
    // Index by tags
    (schemaDefinition.tags || []).forEach(tag => {
      if (!this.schemaTags.has(tag)) {
        this.schemaTags.set(tag, new Set());
      }
      this.schemaTags.get(tag)!.add(fullName);
    });

    // Pre-compile schema for better performance
    this.cachingService.getOrCompileSchema(schema, { enableOptimization: true });

    this.logger.log(`Registered schema '${fullName}'`);
    return schema;
  }

  /**
   * Get a schema by name and version
   */
  get<T extends z.ZodSchema>(name: string, version?: string): T {
    const targetVersion = version || this.getLatestVersion(name);
    const fullName = `${name}@${targetVersion}`;
    
    const schemaDefinition = this.schemas.get(fullName);
    if (!schemaDefinition) {
      throw new Error(`Schema '${fullName}' not found`);
    }

    // Update usage statistics
    this.updateUsageStats(fullName);

    return schemaDefinition.schema as T;
  }

  /**
   * Get schema with fallback to latest version
   */
  getWithFallback<T extends z.ZodSchema>(name: string, version?: string): T {
    try {
      return this.get<T>(name, version);
    } catch (error) {
      if (version) {
        // Try to get latest version as fallback
        try {
          return this.get<T>(name);
        } catch (fallbackError) {
          throw new Error(`Schema '${name}' not found in any version`);
        }
      }
      throw error;
    }
  }

  /**
   * Compose schemas with type safety
   */
  compose<T extends z.ZodSchema>(
    name: string,
    composer: (registry: this) => T,
    options?: {
      version?: string;
      description?: string;
      tags?: string[];
      metadata?: Record<string, unknown>;
    }
  ): T {
    const schema = composer(this);
    return this.register(name, schema, options);
  }

  /**
   * Create schema composition
   */
  createComposition(composition: SchemaComposition): void {
    this.schemaCompositions.set(composition.name, composition);
    this.logger.log(`Created schema composition '${composition.name}'`);
  }

  /**
   * Apply schema composition
   */
  applyComposition<T extends z.ZodSchema>(
    compositionName: string,
    options?: {
      version?: string;
      description?: string;
      tags?: string[];
      metadata?: Record<string, unknown>;
    }
  ): T {
    const composition = this.schemaCompositions.get(compositionName);
    if (!composition) {
      throw new Error(`Schema composition '${compositionName}' not found`);
    }

    // Get base schema
    let schema = this.get(composition.baseSchema);

    // Apply transformations
    for (const transformation of composition.transformations) {
      if (!transformation.condition || transformation.condition(schema)) {
        schema = transformation.transform(schema);
      }
    }

    // Apply validations
    for (const validation of composition.validations) {
      if (!validation.condition || validation.condition(schema)) {
        schema = validation.validation(schema);
      }
    }

    // Register composed schema
    return this.register(compositionName, schema as T, options);
  }

  /**
   * Search schemas with filters
   */
  search(options: SchemaSearchOptions): SchemaDefinition[] {
    let results = Array.from(this.schemas.values());

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      results = results.filter(schema => 
        options.tags!.some(tag => (schema.tags || []).includes(tag))
      );
    }

    // Filter by version
    if (options.version) {
      results = results.filter(schema => schema.version === options.version);
    }

    // Filter by active status
    if (options.isActive !== undefined) {
      results = results.filter(schema => schema.isActive === options.isActive);
    }

    // Filter by creation date
    if (options.createdAfter) {
      results = results.filter(schema => schema.createdAt >= options.createdAfter!);
    }

    if (options.createdBefore) {
      results = results.filter(schema => schema.createdAt <= options.createdBefore!);
    }

    // Filter by usage count
    if (options.usageCountMin !== undefined) {
      results = results.filter(schema => schema.usageCount >= options.usageCountMin!);
    }

    if (options.usageCountMax !== undefined) {
      results = results.filter(schema => schema.usageCount <= options.usageCountMax!);
    }

    return results;
  }

  /**
   * Get schema versions
   */
  getVersions(name: string): string[] {
    const versions = this.schemaVersions.get(name);
    return versions ? Array.from(versions.keys()).sort() : [];
  }

  /**
   * Get latest version of a schema
   */
  getLatestVersion(name: string): string {
    const versions = this.getVersions(name);
    if (versions.length === 0) {
      throw new Error(`No versions found for schema '${name}'`);
    }
    return versions[versions.length - 1]!;
  }

  /**
   * Deactivate a schema version
   */
  deactivate(name: string, version?: string): void {
    const targetVersion = version || this.getLatestVersion(name);
    const fullName = `${name}@${targetVersion}`;
    
    const schema = this.schemas.get(fullName);
    if (schema) {
      schema.isActive = false;
      schema.updatedAt = new Date();
      this.logger.log(`Deactivated schema '${fullName}'`);
    }
  }

  /**
   * Activate a schema version
   */
  activate(name: string, version?: string): void {
    const targetVersion = version || this.getLatestVersion(name);
    const fullName = `${name}@${targetVersion}`;
    
    const schema = this.schemas.get(fullName);
    if (schema) {
      schema.isActive = true;
      schema.updatedAt = new Date();
      this.logger.log(`Activated schema '${fullName}'`);
    }
  }

  /**
   * Get schema usage statistics
   */
  getUsageStats(): SchemaUsageStats {
    const schemas = Array.from(this.schemas.values());
    const activeSchemas = schemas.filter(s => s.isActive);
    
    const mostUsedSchemas = schemas
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10)
      .map(s => ({ name: s.name, usageCount: s.usageCount }));

    const recentlyUsedSchemas = schemas
      .filter(s => s.lastUsed)
      .sort((a, b) => b.lastUsed!.getTime() - a.lastUsed!.getTime())
      .slice(0, 10)
      .map(s => ({ name: s.name, lastUsed: s.lastUsed! }));

    const schemaVersions: Record<string, number> = {};
    this.schemaVersions.forEach((versions, name) => {
      schemaVersions[name] = versions.size;
    });

    return {
      totalSchemas: schemas.length,
      activeSchemas: activeSchemas.length,
      mostUsedSchemas,
      recentlyUsedSchemas,
      schemaVersions,
    };
  }

  /**
   * Get schema by tags
   */
  getByTags(tags: string[]): SchemaDefinition[] {
    const schemas = new Set<string>();
    
    tags.forEach(tag => {
      const tagSchemas = this.schemaTags.get(tag);
      if (tagSchemas) {
        tagSchemas.forEach(schemaName => schemas.add(schemaName));
      }
    });

    return Array.from(schemas)
      .map(name => this.schemas.get(name)!)
      .filter(Boolean);
  }

  /**
   * Clone a schema with modifications
   */
  clone<T extends z.ZodSchema>(
    sourceName: string,
    targetName: string,
    modifications: {
      version?: string;
      description?: string;
      tags?: string[];
      metadata?: Record<string, unknown>;
      transform?: (schema: T) => T;
    }
  ): T {
    const sourceSchema = this.get<T>(sourceName);
    const modifiedSchema = modifications.transform 
      ? modifications.transform(sourceSchema)
      : sourceSchema;

    return this.register(targetName, modifiedSchema, {
      version: modifications.version,
      description: modifications.description,
      tags: modifications.tags,
      metadata: modifications.metadata,
    });
  }

  /**
   * Validate schema compatibility
   */
  validateCompatibility(schema1: string, schema2: string): {
    compatible: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    
    try {
      const s1 = this.get(schema1);
      const s2 = this.get(schema2);
      
      // Basic compatibility check
      if ((s1._def as { typeName?: string }).typeName !== (s2._def as { typeName?: string }).typeName) {
        issues.push('Different schema types');
      }
      
      // More sophisticated compatibility checks would go here
      
      return {
        compatible: issues.length === 0,
        issues
      };
    } catch (error) {
      return {
        compatible: false,
        issues: [`Error validating compatibility: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Export schema definitions
   */
  export(): {
    schemas: SchemaDefinition[];
    compositions: SchemaComposition[];
    metadata: {
      exportedAt: Date;
      totalSchemas: number;
      totalCompositions: number;
    };
  } {
    return {
      schemas: Array.from(this.schemas.values()),
      compositions: Array.from(this.schemaCompositions.values()),
      metadata: {
        exportedAt: new Date(),
        totalSchemas: this.schemas.size,
        totalCompositions: this.schemaCompositions.size,
      }
    };
  }

  /**
   * Import schema definitions
   */
  import(data: {
    schemas: SchemaDefinition[];
    compositions: SchemaComposition[];
  }): void {
    // Import schemas
    data.schemas.forEach(schemaDef => {
      this.schemas.set(`${schemaDef.name}@${schemaDef.version}`, schemaDef);
    });

    // Import compositions
    data.compositions.forEach(composition => {
      this.schemaCompositions.set(composition.name, composition);
    });

    this.logger.log(`Imported ${data.schemas.length} schemas and ${data.compositions.length} compositions`);
  }

  /**
   * Clear all schemas
   */
  clear(): void {
    this.schemas.clear();
    this.schemaVersions.clear();
    this.schemaTags.clear();
    this.schemaCompositions.clear();
    this.usageStats.clear();
    this.logger.log('All schemas cleared');
  }

  /**
   * Load default schemas
   */
  private async loadDefaultSchemas(): Promise<void> {
    // Load common schemas
    const commonSchemas = [
      { name: 'string', schema: z.string() },
      { name: 'number', schema: z.number() },
      { name: 'boolean', schema: z.boolean() },
      { name: 'email', schema: z.string().email() },
      { name: 'uuid', schema: z.string().uuid() },
      { name: 'url', schema: z.string().url() },
      { name: 'date', schema: z.date() },
      { name: 'array', schema: z.array(z.unknown()) },
      { name: 'object', schema: z.object({}) },
    ];

    for (const { name, schema } of commonSchemas) {
      this.register(name, schema, {
        description: `Common ${name} schema`,
        tags: ['common', 'built-in'],
      });
    }
  }

  /**
   * Update usage statistics
   */
  private updateUsageStats(schemaName: string): void {
    const stats = this.usageStats.get(schemaName) || {
      usageCount: 0,
      averageValidationTime: 0,
      errorRate: 0,
    };

    stats.usageCount++;
    stats.lastUsed = new Date();

    this.usageStats.set(schemaName, stats);

    // Update schema definition
    const schema = this.schemas.get(schemaName);
    if (schema) {
      schema.usageCount++;
      schema.lastUsed = new Date();
    }
  }
}

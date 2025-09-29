import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { z } from 'zod';
import { SchemaRegistryService } from './schema-registry.service';

export interface SchemaDiscoveryOptions {
  autoDiscover: boolean;
  scanPaths: string[];
  excludePatterns: string[];
  includePatterns: string[];
  watchForChanges: boolean;
  generateTypes: boolean;
  generateDocs: boolean;
}

export interface DiscoveredSchema {
  name: string;
  schema: z.ZodSchema;
  filePath: string;
  lineNumber: number;
  exports: string[];
  dependencies: string[];
  usage: {
    decorators: string[];
    controllers: string[];
    services: string[];
  };
  metadata: {
    complexity: number;
    size: number;
    lastModified: Date;
    version: string;
  };
}

export interface SchemaUsage {
  schemaName: string;
  usedIn: {
    decorators: Array<{
      file: string;
      line: number;
      decorator: string;
    }>;
    controllers: Array<{
      file: string;
      line: number;
      method: string;
    }>;
    services: Array<{
      file: string;
      line: number;
      method: string;
    }>;
  };
  usageCount: number;
  lastUsed: Date;
}

@Injectable()
export class SchemaDiscoveryService implements OnModuleInit {
  private readonly logger = new Logger(SchemaDiscoveryService.name);
  private discoveredSchemas = new Map<string, DiscoveredSchema>();
  private schemaUsage = new Map<string, SchemaUsage>();
  // private fileWatchers = new Map<string, any>();

  constructor(
    private readonly schemaRegistry: SchemaRegistryService
  ) {}

  async onModuleInit() {
    this.logger.log('Schema Discovery Service initialized');
    await this.discoverSchemas();
  }

  /**
   * Discover all schemas in the project
   */
  async discoverSchemas(options?: Partial<SchemaDiscoveryOptions>): Promise<DiscoveredSchema[]> {
    const config: SchemaDiscoveryOptions = {
      autoDiscover: true,
      scanPaths: ['src/**/*.ts', 'packages/**/src/**/*.ts'],
      excludePatterns: ['**/*.spec.ts', '**/*.test.ts', '**/node_modules/**'],
      includePatterns: ['**/*schema*.ts', '**/*validation*.ts'],
      watchForChanges: true,
      generateTypes: true,
      generateDocs: true,
      ...options
    };

    this.logger.log('Starting schema discovery...');

    // This would use file system scanning and AST parsing
    // For now, we'll simulate the discovery process
    const schemas = await this.scanForSchemas(config);
    
    // Register discovered schemas
    for (const schema of schemas) {
      await this.registerDiscoveredSchema(schema);
    }

    this.logger.log(`Discovered ${schemas.length} schemas`);
    return schemas;
  }

  /**
   * Find schemas by name or pattern
   */
  findSchemas(pattern: string | RegExp): DiscoveredSchema[] {
    const results: DiscoveredSchema[] = [];
    
    for (const [_name, schema] of this.discoveredSchemas) {
      if (typeof pattern === 'string') {
        if (_name.includes(pattern) || schema.filePath.includes(pattern)) {
          results.push(schema);
        }
      } else {
        if (pattern.test(_name) || pattern.test(schema.filePath)) {
          results.push(schema);
        }
      }
    }
    
    return results;
  }

  /**
   * Get schema usage information
   */
  getSchemaUsage(schemaName: string): SchemaUsage | undefined {
    return this.schemaUsage.get(schemaName);
  }

  /**
   * Get all schemas with their usage statistics
   */
  getAllSchemasWithUsage(): Array<DiscoveredSchema & { usage: SchemaUsage }> {
    const results: Array<DiscoveredSchema & { usage: SchemaUsage }> = [];
    
    for (const [name, schema] of this.discoveredSchemas) {
      const usage = this.schemaUsage.get(name);
      results.push({
        ...schema,
        usage: {
          schemaName: name,
          usedIn: {
            decorators: usage?.usedIn?.decorators || [],
            controllers: usage?.usedIn?.controllers || [],
            services: usage?.usedIn?.services || []
          },
          usageCount: usage?.usageCount || 0,
          lastUsed: usage?.lastUsed || new Date()
        } as SchemaUsage
      });
    }
    
    return results;
  }

  /**
   * Find unused schemas
   */
  findUnusedSchemas(): DiscoveredSchema[] {
    const unused: DiscoveredSchema[] = [];
    
    for (const [_name, schema] of this.discoveredSchemas) {
      const usage = this.schemaUsage.get(_name);
      if (!usage || usage.usageCount === 0) {
        unused.push(schema);
      }
    }
    
    return unused;
  }

  /**
   * Find schemas with high complexity
   */
  findComplexSchemas(threshold = 10): DiscoveredSchema[] {
    const complex: DiscoveredSchema[] = [];
    
    for (const [_name, schema] of this.discoveredSchemas) {
      if (schema.metadata.complexity > threshold) {
        complex.push(schema);
      }
    }
    
    return complex.sort((a, b) => b.metadata.complexity - a.metadata.complexity);
  }

  /**
   * Generate schema documentation
   */
  generateSchemaDocs(schemaName?: string): string {
    if (schemaName) {
      const schema = this.discoveredSchemas.get(schemaName);
      if (!schema) {
        throw new Error(`Schema '${schemaName}' not found`);
      }
      return this.generateSingleSchemaDoc(schema);
    }

    // Generate docs for all schemas
    let docs = '# Schema Documentation\n\n';
    
    for (const [_name, schema] of this.discoveredSchemas) {
      docs += this.generateSingleSchemaDoc(schema);
      docs += '\n---\n\n';
    }
    
    return docs;
  }

  /**
   * Generate TypeScript types from schemas
   */
  generateTypes(schemaName?: string): string {
    if (schemaName) {
      const schema = this.discoveredSchemas.get(schemaName);
      if (!schema) {
        throw new Error(`Schema '${schemaName}' not found`);
      }
      return this.generateSingleSchemaTypes(schema);
    }

    // Generate types for all schemas
    let types = '// Auto-generated types from schemas\n\n';
    
    for (const [_name, schema] of this.discoveredSchemas) {
      types += this.generateSingleSchemaTypes(schema);
      types += '\n';
    }
    
    return types;
  }

  /**
   * Validate schema consistency across the project
   */
  async validateSchemaConsistency(): Promise<{
    valid: boolean;
    issues: Array<{
      type: 'error' | 'warning';
      message: string;
      schema: string;
      file: string;
      line: number;
    }>;
  }> {
    const issues: Array<{
      type: 'error' | 'warning';
      message: string;
      schema: string;
      file: string;
      line: number;
    }> = [];

    // Check for duplicate schema names
    const nameCounts = new Map<string, number>();
    for (const [name, _schema] of this.discoveredSchemas) {
      nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
    }

    for (const [name, count] of nameCounts) {
      if (count > 1) {
        issues.push({
          type: 'error',
          message: `Duplicate schema name '${name}' found in ${count} files`,
          schema: name,
          file: '',
          line: 0
        });
      }
    }

    // Check for circular dependencies
    for (const [name, schema] of this.discoveredSchemas) {
      const circular = this.detectCircularDependencies(name, new Set());
      if (circular.length > 0) {
        issues.push({
          type: 'error',
          message: `Circular dependency detected: ${circular.join(' -> ')}`,
          schema: name,
          file: schema.filePath,
          line: schema.lineNumber
        });
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  // Private methods
  private async scanForSchemas(_config: SchemaDiscoveryOptions): Promise<DiscoveredSchema[]> {
    // This would implement actual file system scanning and AST parsing
    // For now, return mock data
    return [
      {
        name: 'UserSchema',
        schema: z.object({
          id: z.string(),
          email: z.string().email(),
          name: z.string()
        }),
        filePath: 'src/schemas/user.schema.ts',
        lineNumber: 10,
        exports: ['UserSchema', 'CreateUserSchema'],
        dependencies: ['BaseSchema'],
        usage: {
          decorators: ['@ValidateBody'],
          controllers: ['UsersController'],
          services: ['UserService']
        },
        metadata: {
          complexity: 5,
          size: 1024,
          lastModified: new Date(),
          version: '1.0.0'
        }
      }
    ];
  }

  private async registerDiscoveredSchema(schema: DiscoveredSchema): Promise<void> {
    this.discoveredSchemas.set(schema.name, schema);
    
    // Register with schema registry - using the correct method
    this.schemaRegistry.register(schema.name, schema.schema, {
      version: schema.metadata.version,
      description: `Schema from ${schema.filePath}`,
      tags: [],
      metadata: {
        filePath: schema.filePath,
        lineNumber: schema.lineNumber,
        ...schema.metadata
      }
    });
  }

  private generateSingleSchemaDoc(schema: DiscoveredSchema): string {
    let doc = `## ${schema.name}\n\n`;
    doc += `**File:** ${schema.filePath}:${schema.lineNumber}\n\n`;
    doc += `**Complexity:** ${schema.metadata.complexity}\n\n`;
    doc += `**Size:** ${schema.metadata.size} bytes\n\n`;
    doc += `**Last Modified:** ${schema.metadata.lastModified.toISOString()}\n\n`;
    
    if (schema.usage.decorators.length > 0) {
      doc += `**Used in Decorators:**\n`;
      for (const decorator of schema.usage.decorators) {
        doc += `- ${decorator}\n`;
      }
      doc += '\n';
    }
    
    if (schema.usage.controllers.length > 0) {
      doc += `**Used in Controllers:**\n`;
      for (const controller of schema.usage.controllers) {
        doc += `- ${controller}\n`;
      }
      doc += '\n';
    }
    
    if (schema.usage.services.length > 0) {
      doc += `**Used in Services:**\n`;
      for (const service of schema.usage.services) {
        doc += `- ${service}\n`;
      }
      doc += '\n';
    }
    
    return doc;
  }

  private generateSingleSchemaTypes(schema: DiscoveredSchema): string {
    return `export type ${schema.name} = z.infer<typeof ${schema.name}>;\n`;
  }

  private detectCircularDependencies(schemaName: string, visited: Set<string>): string[] {
    if (visited.has(schemaName)) {
      return Array.from(visited);
    }
    
    visited.add(schemaName);
    const schema = this.discoveredSchemas.get(schemaName);
    if (!schema) {
      return [];
    }
    
    for (const dep of schema.dependencies) {
      const circular = this.detectCircularDependencies(dep, new Set(visited));
      if (circular.length > 0) {
        return circular;
      }
    }
    
    visited.delete(schemaName);
    return [];
  }
}

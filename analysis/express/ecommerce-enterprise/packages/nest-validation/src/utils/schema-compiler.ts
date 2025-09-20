import { Injectable, Logger } from '@nestjs/common';
import Ajv, { JSONSchemaType } from 'ajv';
import addFormats from 'ajv-formats';
import addErrors from 'ajv-errors';
import addKeywords from 'ajv-keywords';

@Injectable()
export class SchemaCompiler {
  private readonly logger = new Logger(SchemaCompiler.name);
  private readonly ajv: Ajv;
  private readonly compiledSchemas = new Map<string, any>();

  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false,
    });
    
    addFormats(this.ajv);
    addErrors(this.ajv);
    addKeywords(this.ajv);
  }

  compile<T>(schema: JSONSchemaType<T> | object, name?: string): (data: any) => boolean {
    const schemaName = name || 'anonymous';
    
    // Check if already compiled
    if (this.compiledSchemas.has(schemaName)) {
      return this.compiledSchemas.get(schemaName);
    }

    try {
      const validate = this.ajv.compile(schema);
      this.compiledSchemas.set(schemaName, validate);
      this.logger.log(`Compiled schema: ${schemaName}`);
      return validate;
    } catch (error) {
      this.logger.error(`Failed to compile schema ${schemaName}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  getCompiledSchema(name: string): any {
    return this.compiledSchemas.get(name);
  }

  hasCompiledSchema(name: string): boolean {
    return this.compiledSchemas.has(name);
  }

  removeCompiledSchema(name: string): void {
    this.compiledSchemas.delete(name);
    this.logger.log(`Removed compiled schema: ${name}`);
  }

  clearCompiledSchemas(): void {
    this.compiledSchemas.clear();
    this.logger.log('Cleared all compiled schemas');
  }

  getCompiledSchemasCount(): number {
    return this.compiledSchemas.size;
  }

  getAjvInstance(): Ajv {
    return this.ajv;
  }
}


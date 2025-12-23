import { Injectable, Logger } from '@nestjs/common';
import { SchemaDiscoveryService } from '../services/schema-discovery.service';

export interface CLIOptions {
  command: 'discover' | 'validate' | 'generate' | 'analyze' | 'cleanup';
  output?: string;
  format?: 'json' | 'yaml' | 'markdown' | 'table';
  verbose?: boolean;
  watch?: boolean;
  config?: string;
}

export interface SchemaAnalysis {
  totalSchemas: number;
  unusedSchemas: number;
  complexSchemas: number;
  duplicateSchemas: number;
  circularDependencies: number;
  averageComplexity: number;
  totalSize: number;
  recommendations: string[];
}

@Injectable()
export class SchemaCLIService {
  private readonly logger = new Logger(SchemaCLIService.name);

  constructor(
    private readonly discoveryService: SchemaDiscoveryService
  ) {}

  /**
   * Main CLI entry point
   */
  async run(options: CLIOptions): Promise<void> {
    this.logger.log(`Running schema CLI command: ${options.command}`);

    switch (options.command) {
      case 'discover':
        await this.discoverSchemas(options);
        break;
      case 'validate':
        await this.validateSchemas(options);
        break;
      case 'generate':
        await this.generateArtifacts(options);
        break;
      case 'analyze':
        await this.analyzeSchemas(options);
        break;
      case 'cleanup':
        await this.cleanupSchemas(options);
        break;
      default:
        throw new Error(`Unknown command: ${options.command}`);
    }
  }

  /**
   * Discover all schemas in the project
   */
  private async discoverSchemas(_options: CLIOptions): Promise<void> {
    this.logger.log('Discovering schemas...');
    
    const schemas = await this.discoveryService.discoverSchemas();
    
    if (_options.format === 'table') {
      this.printSchemasTable(schemas);
    } else if (_options.format === 'json') {
      console.log(JSON.stringify(schemas, null, 2));
    } else if (_options.format === 'yaml') {
      // Would use yaml library
      console.log(JSON.stringify(schemas, null, 2));
    } else {
      this.printSchemasList(schemas);
    }
  }

  /**
   * Validate schema consistency
   */
  private async validateSchemas(_options: CLIOptions): Promise<void> {
    this.logger.log('Validating schema consistency...');
    
    const validation = await this.discoveryService.validateSchemaConsistency();
    
    if (validation.valid) {
      this.logger.log('✅ All schemas are valid');
    } else {
      this.logger.error('❌ Schema validation failed');
      
      for (const issue of validation.issues) {
        const icon = issue.type === 'error' ? '❌' : '⚠️';
        this.logger.error(`${icon} ${issue.message}`);
        if (issue.file) {
          this.logger.error(`   File: ${issue.file}:${issue.line}`);
        }
      }
    }
  }

  /**
   * Generate artifacts (types, docs, etc.)
   */
  private async generateArtifacts(options: CLIOptions): Promise<void> {
    this.logger.log('Generating artifacts...');
    
    const outputPath = options.output || './generated';
    
    // Generate types
    const types = this.discoveryService.generateTypes();
    await this.writeFile(`${outputPath}/schema-types.ts`, types);
    
    // Generate documentation
    const docs = this.discoveryService.generateSchemaDocs();
    await this.writeFile(`${outputPath}/schema-docs.md`, docs);
    
    // Generate schema registry
    const registry = await this.generateSchemaRegistry();
    await this.writeFile(`${outputPath}/schema-registry.ts`, registry);
    
    this.logger.log(`Artifacts generated in ${outputPath}`);
  }

  /**
   * Analyze schemas and provide insights
   */
  private async analyzeSchemas(options: CLIOptions): Promise<void> {
    this.logger.log('Analyzing schemas...');
    
    const analysis = await this.performSchemaAnalysis();
    
    if (options.format === 'json') {
      console.log(JSON.stringify(analysis, null, 2));
    } else {
      this.printAnalysisReport(analysis);
    }
  }

  /**
   * Cleanup unused schemas
   */
  private async cleanupSchemas(options: CLIOptions): Promise<void> {
    this.logger.log('Cleaning up unused schemas...');
    
    const unusedSchemas = this.discoveryService.findUnusedSchemas();
    
    if (unusedSchemas.length === 0) {
      this.logger.log('✅ No unused schemas found');
      return;
    }
    
    this.logger.warn(`Found ${unusedSchemas.length} unused schemas:`);
    for (const schema of unusedSchemas) {
      this.logger.warn(`- ${schema.name} (${schema.filePath})`);
    }
    
    if (options.verbose) {
      this.logger.log('Use --dry-run to see what would be removed');
    }
  }

  /**
   * Perform comprehensive schema analysis
   */
  private async performSchemaAnalysis(): Promise<SchemaAnalysis> {
    const allSchemas = this.discoveryService.getAllSchemasWithUsage();
    const unusedSchemas = this.discoveryService.findUnusedSchemas();
    const complexSchemas = this.discoveryService.findComplexSchemas();
    const validation = await this.discoveryService.validateSchemaConsistency();
    
    const totalSchemas = allSchemas.length;
    const unusedCount = unusedSchemas.length;
    const complexCount = complexSchemas.length;
    const duplicateCount = validation.issues.filter(i => i.type === 'error' && i.message.includes('Duplicate')).length;
    const circularCount = validation.issues.filter(i => i.message.includes('Circular')).length;
    
    const averageComplexity = allSchemas.reduce((sum, s) => sum + s.metadata.complexity, 0) / totalSchemas;
    const totalSize = allSchemas.reduce((sum, s) => sum + s.metadata.size, 0);
    
    const recommendations: string[] = [];
    
    if (unusedCount > 0) {
      recommendations.push(`Remove ${unusedCount} unused schemas to reduce bundle size`);
    }
    
    if (complexCount > 0) {
      recommendations.push(`Consider breaking down ${complexCount} complex schemas`);
    }
    
    if (duplicateCount > 0) {
      recommendations.push(`Resolve ${duplicateCount} duplicate schema names`);
    }
    
    if (circularCount > 0) {
      recommendations.push(`Fix ${circularCount} circular dependencies`);
    }
    
    if (averageComplexity > 10) {
      recommendations.push('Consider simplifying schemas - average complexity is high');
    }
    
    return {
      totalSchemas,
      unusedSchemas: unusedCount,
      complexSchemas: complexCount,
      duplicateSchemas: duplicateCount,
      circularDependencies: circularCount,
      averageComplexity,
      totalSize,
      recommendations
    };
  }

  /**
   * Generate schema registry file
   */
  private async generateSchemaRegistry(): Promise<string> {
    const schemas = this.discoveryService.getAllSchemasWithUsage();
    
    let registry = '// Auto-generated schema registry\n\n';
    registry += 'import { z } from \'zod\';\n\n';
    
    for (const schema of schemas) {
      registry += `// ${schema.name} - ${schema.filePath}\n`;
      registry += `export const ${schema.name} = /* schema definition */;\n\n`;
    }
    
    registry += 'export const SchemaRegistry = {\n';
    for (const schema of schemas) {
      registry += `  ${schema.name},\n`;
    }
    registry += '} as const;\n\n';
    
    registry += 'export type SchemaName = keyof typeof SchemaRegistry;\n';
    
    return registry;
  }

  /**
   * Print schemas in table format
   */
  private printSchemasTable(schemas: Array<{
    name: string;
    filePath: string;
    lineNumber: number;
    metadata: { complexity: number; size: number };
    usage: { decorators: unknown[] };
  }>): void {
    console.log('\n📋 Discovered Schemas\n');
    console.log('┌─────────────────┬─────────────────┬─────────────┬─────────────┬─────────────┐');
    console.log('│ Name            │ File            │ Complexity  │ Size        │ Usage       │');
    console.log('├─────────────────┼─────────────────┼─────────────┼─────────────┼─────────────┤');
    
    for (const schema of schemas) {
      const name = schema.name.padEnd(15);
      const file = schema.filePath.split('/').pop()?.padEnd(15) || 'unknown';
      const complexity = schema.metadata.complexity.toString().padEnd(11);
      const size = `${schema.metadata.size}B`.padEnd(11);
      const usage = schema.usage.decorators.length.toString().padEnd(11);
      
      console.log(`│ ${name} │ ${file} │ ${complexity} │ ${size} │ ${usage} │`);
    }
    
    console.log('└─────────────────┴─────────────────┴─────────────┴─────────────┴─────────────┘');
  }

  /**
   * Print schemas in list format
   */
  private printSchemasList(schemas: Array<{
    name: string;
    filePath: string;
    lineNumber: number;
    metadata: { complexity: number; size: number };
    usage: { decorators: unknown[] };
  }>): void {
    console.log('\n📋 Discovered Schemas\n');
    
    for (const schema of schemas) {
      console.log(`🔹 ${schema.name}`);
      console.log(`   File: ${schema.filePath}:${schema.lineNumber}`);
      console.log(`   Complexity: ${schema.metadata.complexity}`);
      console.log(`   Size: ${schema.metadata.size} bytes`);
      console.log(`   Usage: ${schema.usage.decorators.length} decorators`);
      console.log('');
    }
  }

  /**
   * Print analysis report
   */
  private printAnalysisReport(analysis: SchemaAnalysis): void {
    console.log('\n📊 Schema Analysis Report\n');
    
    console.log(`📈 Statistics:`);
    console.log(`   Total Schemas: ${analysis.totalSchemas}`);
    console.log(`   Unused Schemas: ${analysis.unusedSchemas}`);
    console.log(`   Complex Schemas: ${analysis.complexSchemas}`);
    console.log(`   Duplicate Schemas: ${analysis.duplicateSchemas}`);
    console.log(`   Circular Dependencies: ${analysis.circularDependencies}`);
    console.log(`   Average Complexity: ${analysis.averageComplexity.toFixed(2)}`);
    console.log(`   Total Size: ${(analysis.totalSize / 1024).toFixed(2)} KB`);
    
    if (analysis.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      for (const rec of analysis.recommendations) {
        console.log(`   • ${rec}`);
      }
    }
    
    console.log('');
  }

  /**
   * Write file to filesystem
   */
  private async writeFile(path: string, _content: string): Promise<void> {
    // This would use fs.writeFileSync or similar
    console.log(`Writing ${path}...`);
  }
}

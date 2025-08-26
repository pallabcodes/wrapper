/**
 * Unified Data Processing System
 * 
 * Production-grade data processing for CSV and Excel files with:
 * - Multi-format support (CSV, XLSX)
 * - Integration with multi-ORM system
 * - High-performance streaming
 * - Data validation and cleaning
 * - Efficient database insertion
 * - Progress monitoring and error recovery
 * 
 * Built for enterprise data migration and bulk operations.
 */

import { existsSync, readdirSync } from 'fs';
import { join, extname } from 'path';
import { EventEmitter } from 'events';
import { z } from 'zod';
import { csvProcessor } from './csv-processor.js';
import { excelProcessor, DataGenerationUtils } from './excel-processor.js';
import { multiORMManager } from '../database/multi-orm-system.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type FileFormat = 'csv' | 'xlsx' | 'xls';

export interface DataProcessingConfig {
  format: FileFormat;
  filePath: string;
  tableName: string;
  batchSize: number;
  maxErrors: number;
  skipEmptyRows: boolean;
  skipRowsWithError: boolean;
  useTransaction: boolean;
  parallelInserts: number;
  conflictResolution: 'ignore' | 'update' | 'error';
  validationRules: ValidationRule[];
  cleaningRules: CleaningRule[];
}

export interface ValidationRule {
  field: string;
  schema: z.ZodSchema;
  required: boolean;
  transform?: (value: any) => any;
}

export interface CleaningRule {
  field: string;
  operations: CleaningOperation[];
}

export interface CleaningOperation {
  type: 'trim' | 'lowercase' | 'uppercase' | 'normalize' | 'sanitize' | 'format' | 'replace' | 'parseDate' | 'parseNumber';
  params?: any;
}

export interface ProcessingResult {
  success: boolean;
  metrics: {
    totalRows: number;
    processedRows: number;
    errorRows: number;
    skippedRows: number;
    processingRate: number;
    duration: number;
  };
  errors?: string[];
  warnings?: string[];
}

// ============================================================================
// UNIFIED DATA PROCESSOR
// ============================================================================

export class UnifiedDataProcessor extends EventEmitter {
  private config: DataProcessingConfig;

  constructor(config: DataProcessingConfig) {
    super();
    this.config = config;
  }

  /**
   * Process data file and insert into database
   */
  async processFile(): Promise<ProcessingResult> {
    try {
      // Validate file exists
      if (!existsSync(this.config.filePath)) {
        throw new Error(`File not found: ${this.config.filePath}`);
      }

      // Determine file format
      const format = this.detectFileFormat(this.config.filePath);
      if (format !== this.config.format) {
        console.warn(`⚠️ Detected format ${format} differs from configured format ${this.config.format}`);
      }

      console.log(`🚀 Starting ${format.toUpperCase()} processing: ${this.config.filePath}`);

      // Setup validation and cleaning rules
      this.setupValidationRules();
      this.setupCleaningRules();

      // Process based on format
      let result: ProcessingResult;
      
      if (format === 'csv') {
        result = await this.processCSV();
      } else if (format === 'xlsx' || format === 'xls') {
        result = await this.processExcel();
      } else {
        throw new Error(`Unsupported file format: ${format}`);
      }

      console.log(`✅ Data processing completed successfully`);
      return result;

    } catch (error) {
      console.error(`❌ Data processing failed:`, error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Process CSV file
   */
  private async processCSV(): Promise<ProcessingResult> {
    const processor = csvProcessor;
    
    // Configure validation rules
    this.config.validationRules.forEach(rule => {
      processor.getValidator().addValidation(rule.field, rule);
    });

    // Configure cleaning rules
    this.config.cleaningRules.forEach(rule => {
      processor.getValidator().addCleaning(rule.field, rule);
    });

    // Setup database insertion strategy
    const insertStrategy = {
      tableName: this.config.tableName,
      conflictResolution: this.config.conflictResolution,
      batchSize: this.config.batchSize,
      useTransaction: this.config.useTransaction,
      parallelInserts: this.config.parallelInserts
    };

    // Process file (CSV processor expects inputPath, outputPath, insertStrategy)
    const outputPath = this.config.filePath.replace(/\.csv$/, '_processed.csv');
    const metrics = await processor.processFile(this.config.filePath, outputPath, insertStrategy);

    return {
      success: true,
      metrics: {
        totalRows: metrics.totalRows,
        processedRows: metrics.processedRows,
        errorRows: metrics.errorRows,
        skippedRows: metrics.skippedRows,
        processingRate: metrics.processingRate,
        duration: metrics.duration || 0
      }
    };
  }

  /**
   * Process Excel file
   */
  private async processExcel(): Promise<ProcessingResult> {
    const processor = excelProcessor;
    
    // Configure validation rules
    this.config.validationRules.forEach(rule => {
      processor.getValidator().addValidation(rule.field, rule);
    });

    // Configure cleaning rules
    this.config.cleaningRules.forEach(rule => {
      processor.getValidator().addCleaning(rule.field, rule);
    });

    // Setup database insertion strategy
    const insertStrategy = {
      tableName: this.config.tableName,
      conflictResolution: this.config.conflictResolution,
      batchSize: this.config.batchSize,
      useTransaction: this.config.useTransaction,
      parallelInserts: this.config.parallelInserts
    };

    // Process file
    const metrics = await processor.processFile(this.config.filePath, insertStrategy);

    return {
      success: true,
      metrics: {
        totalRows: metrics.totalRows,
        processedRows: metrics.processedRows,
        errorRows: metrics.errorRows,
        skippedRows: metrics.skippedRows,
        processingRate: metrics.processingRate,
        duration: metrics.duration || 0
      }
    };
  }

  /**
   * Detect file format from extension
   */
  private detectFileFormat(filePath: string): FileFormat {
    const ext = extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.csv':
        return 'csv';
      case '.xlsx':
        return 'xlsx';
      case '.xls':
        return 'xls';
      default:
        throw new Error(`Unsupported file extension: ${ext}`);
    }
  }

  /**
   * Setup validation rules
   */
  private setupValidationRules(): void {
    // Common validation rules can be added here
    console.log(`🔧 Configured ${this.config.validationRules.length} validation rules`);
  }

  /**
   * Setup cleaning rules
   */
  private setupCleaningRules(): void {
    // Common cleaning rules can be added here
    console.log(`🧹 Configured ${this.config.cleaningRules.length} cleaning rules`);
  }
}

// ============================================================================
// DATA GENERATION SERVICE
// ============================================================================

class DataGenerationService extends EventEmitter {
  /**
   * Generate sample data files for testing
   */
  static generateSampleFiles(outputDir: string, rows: number = 10000): void {
    console.log(`📄 Generating sample data files with ${rows} rows each`);

    // Generate CSV sample
    const csvPath = join(outputDir, 'sample_products.csv');
    this.generateSampleCSV(csvPath, rows);

    // Generate Excel sample
    const excelPath = join(outputDir, 'sample_products.xlsx');
    DataGenerationUtils.generateSampleExcel(excelPath, rows);

    console.log(`✅ Generated sample files in: ${outputDir}`);
  }

  /**
   * Generate sample CSV file
   */
  private static generateSampleCSV(filePath: string, rows: number): void {
    const fs = require('fs');
    const headers = ['id', 'name', 'email', 'price', 'category', 'created_at'];
    
    let csvContent = headers.join(',') + '\n';
    
    for (let i = 1; i <= rows; i++) {
      const row = [
        i,
        `Product ${i}`,
        `product${i}@example.com`,
        (Math.random() * 1000).toFixed(2),
        ['Electronics', 'Clothing', 'Books', 'Home'][Math.floor(Math.random() * 4)],
        new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
      ];
      csvContent += row.join(',') + '\n';
    }
    
    fs.writeFileSync(filePath, csvContent);
    console.log(`📄 Generated sample CSV file: ${filePath} with ${rows} rows`);
  }

  /**
   * Process multiple files in a directory
   */
  static async processDirectory(
    directoryPath: string,
    tableName: string,
    config: Partial<DataProcessingConfig> = {}
  ): Promise<ProcessingResult[]> {
    const results: ProcessingResult[] = [];
    
    if (!existsSync(directoryPath)) {
      throw new Error(`Directory not found: ${directoryPath}`);
    }

    const files = readdirSync(directoryPath)
      .filter(file => /\.(csv|xlsx|xls)$/i.test(file))
      .map(file => join(directoryPath, file));

    console.log(`📁 Processing ${files.length} files in directory: ${directoryPath}`);

    for (const file of files) {
      try {
        const format = this.detectFileFormat(file);
        const processor = new UnifiedDataProcessor({
          format,
          filePath: file,
          tableName,
          batchSize: 1000,
          maxErrors: 100,
          skipEmptyRows: true,
          skipRowsWithError: false,
          useTransaction: true,
          parallelInserts: 4,
          conflictResolution: 'ignore',
          validationRules: [],
          cleaningRules: [],
          ...config
        });

        const result = await processor.processFile();
        results.push(result);

        console.log(`✅ Processed: ${file} - ${result.metrics.processedRows} rows`);

      } catch (error) {
        console.error(`❌ Failed to process: ${file}`, error);
        results.push({
          success: false,
          metrics: {
            totalRows: 0,
            processedRows: 0,
            errorRows: 0,
            skippedRows: 0,
            processingRate: 0,
            duration: 0
          },
          errors: [error instanceof Error ? error.message : 'Unknown error']
        });
      }
    }

    return results;
  }

  /**
   * Detect file format
   */
  private static detectFileFormat(filePath: string): FileFormat {
    const ext = extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.csv':
        return 'csv';
      case '.xlsx':
        return 'xlsx';
      case '.xls':
        return 'xls';
      default:
        throw new Error(`Unsupported file extension: ${ext}`);
    }
  }
}

// ============================================================================
// PRE-BUILT CONFIGURATIONS
// ============================================================================

export const ProductDataConfig: Partial<DataProcessingConfig> = {
  validationRules: [
    {
      field: 'id',
      schema: z.number().positive(),
      required: true
    },
    {
      field: 'name',
      schema: z.string().min(1).max(255),
      required: true
    },
    {
      field: 'email',
      schema: z.string().email(),
      required: true
    },
    {
      field: 'price',
      schema: z.number().positive(),
      required: true
    },
    {
      field: 'category',
      schema: z.enum(['Electronics', 'Clothing', 'Books', 'Home']),
      required: true
    },
    {
      field: 'created_at',
      schema: z.date(),
      required: false
    }
  ],
  cleaningRules: [
    {
      field: 'name',
      operations: [{ type: 'trim' }, { type: 'sanitize' }]
    },
    {
      field: 'email',
      operations: [{ type: 'lowercase' }, { type: 'trim' }]
    },
    {
      field: 'price',
      operations: [{ type: 'parseNumber' }]
    },
    {
      field: 'created_at',
      operations: [{ type: 'parseDate' }]
    }
  ]
};

export const UserDataConfig: Partial<DataProcessingConfig> = {
  validationRules: [
    {
      field: 'id',
      schema: z.number().positive(),
      required: true
    },
    {
      field: 'email',
      schema: z.string().email(),
      required: true
    },
    {
      field: 'name',
      schema: z.string().min(1).max(255),
      required: true
    },
    {
      field: 'role',
      schema: z.enum(['admin', 'customer', 'manager']),
      required: true
    }
  ],
  cleaningRules: [
    {
      field: 'email',
      operations: [{ type: 'lowercase' }, { type: 'trim' }]
    },
    {
      field: 'name',
      operations: [{ type: 'trim' }, { type: 'sanitize' }]
    }
  ]
};

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

export const DataProcessingExamples = {
  /**
   * Process a single CSV file
   */
  async processCSVExample(): Promise<void> {
    const processor = new UnifiedDataProcessor({
      format: 'csv',
      filePath: './data/products.csv',
      tableName: 'products',
      batchSize: 1000,
      maxErrors: 100,
      skipEmptyRows: true,
      skipRowsWithError: false,
      useTransaction: true,
      parallelInserts: 4,
      conflictResolution: 'ignore',
      validationRules: ProductDataConfig.validationRules || [],
      cleaningRules: ProductDataConfig.cleaningRules || []
    });

    const result = await processor.processFile();
    console.log('Processing result:', result);
  },

  /**
   * Process a single Excel file
   */
  async processExcelExample(): Promise<void> {
    const processor = new UnifiedDataProcessor({
      format: 'xlsx',
      filePath: './data/users.xlsx',
      tableName: 'users',
      batchSize: 1000,
      maxErrors: 100,
      skipEmptyRows: true,
      skipRowsWithError: false,
      useTransaction: true,
      parallelInserts: 4,
      conflictResolution: 'ignore',
      validationRules: UserDataConfig.validationRules || [],
      cleaningRules: UserDataConfig.cleaningRules || []
    });

    const result = await processor.processFile();
    console.log('Processing result:', result);
  },

  /**
   * Process entire directory
   */
  async processDirectoryExample(): Promise<void> {
    const results = await DataGenerationService.processDirectory(
      './data',
      'products',
      ProductDataConfig
    );

    console.log('Directory processing results:', results);
  }
};

// Export main classes
export { UnifiedDataProcessor as DataProcessor };
export { DataGenerationService };

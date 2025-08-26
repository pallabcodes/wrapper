#!/usr/bin/env tsx

/**
 * Data Processing CLI
 * 
 * Command-line interface for processing CSV and Excel files
 * Usage: npm run data:process -- --file=./data/products.csv --table=products
 */

import { Command } from 'commander';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { 
  UnifiedDataProcessor, 
  DataGenerationService,
  ProductDataConfig,
  UserDataConfig,
  type DataProcessingConfig 
} from '../src/infrastructure/data/unified-data-processor.js';

const program = new Command();

// ============================================================================
// CLI COMMANDS
// ============================================================================

program
  .name('data-processor')
  .description('Production-grade data processing for CSV and Excel files')
  .version('1.0.0');

// Process single file
program
  .command('process')
  .description('Process a single CSV or Excel file')
  .requiredOption('-f, --file <path>', 'Path to the data file (CSV, XLSX, XLS)')
  .requiredOption('-t, --table <name>', 'Target database table name')
  .option('-b, --batch-size <number>', 'Batch size for processing', '1000')
  .option('-e, --max-errors <number>', 'Maximum number of errors before stopping', '100')
  .option('--skip-empty', 'Skip empty rows', false)
  .option('--skip-errors', 'Skip rows with errors', false)
  .option('--use-transaction', 'Use database transaction', true)
  .option('--parallel <number>', 'Number of parallel inserts', '4')
  .option('--conflict <strategy>', 'Conflict resolution strategy (ignore|update|error)', 'ignore')
  .option('--config <type>', 'Use pre-built configuration (products|users)', '')
  .action(async (options) => {
    try {
      console.log('🚀 Starting data processing...');
      
      // Validate file exists
      if (!existsSync(options.file)) {
        console.error(`❌ File not found: ${options.file}`);
        process.exit(1);
      }

      // Determine file format
      const format = detectFileFormat(options.file);
      console.log(`📄 Detected format: ${format.toUpperCase()}`);

      // Get configuration
      const config = getConfiguration(options.config, format, options);
      
      // Create processor
      const processor = new UnifiedDataProcessor(config);

      // Process file
      const result = await processor.processFile();

      // Display results
      displayResults(result);

    } catch (error) {
      console.error('❌ Processing failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

// Process directory
program
  .command('process-dir')
  .description('Process all CSV and Excel files in a directory')
  .requiredOption('-d, --directory <path>', 'Path to directory containing data files')
  .requiredOption('-t, --table <name>', 'Target database table name')
  .option('-b, --batch-size <number>', 'Batch size for processing', '1000')
  .option('-e, --max-errors <number>', 'Maximum number of errors before stopping', '100')
  .option('--config <type>', 'Use pre-built configuration (products|users)', '')
  .action(async (options) => {
    try {
      console.log('🚀 Starting directory processing...');
      
      // Validate directory exists
      if (!existsSync(options.directory)) {
        console.error(`❌ Directory not found: ${options.directory}`);
        process.exit(1);
      }

      // Get configuration
      const config = getConfiguration(options.config, 'csv', options);
      
      // Process directory
      const results = await DataGenerationService.processDirectory(
        options.directory,
        options.table,
        config
      );

      // Display results
      displayDirectoryResults(results);

    } catch (error) {
      console.error('❌ Directory processing failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

// Generate sample files
program
  .command('generate')
  .description('Generate sample data files for testing')
  .option('-o, --output <path>', 'Output directory', './data')
  .option('-r, --rows <number>', 'Number of rows to generate', '10000')
  .action(async (options) => {
    try {
      console.log('📄 Generating sample data files...');
      
      // Create output directory if it doesn't exist
      if (!existsSync(options.output)) {
        mkdirSync(options.output, { recursive: true });
      }

      // Generate sample files
      DataGenerationService.generateSampleFiles(options.output, parseInt(options.rows));

      console.log(`✅ Sample files generated in: ${options.output}`);

    } catch (error) {
      console.error('❌ File generation failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

// Validate file structure
program
  .command('validate')
  .description('Validate file structure and data')
  .requiredOption('-f, --file <path>', 'Path to the data file')
  .option('--headers <list>', 'Comma-separated list of expected headers', '')
  .action(async (options) => {
    try {
      console.log('🔍 Validating file structure...');
      
      // Validate file exists
      if (!existsSync(options.file)) {
        console.error(`❌ File not found: ${options.file}`);
        process.exit(1);
      }

      const format = detectFileFormat(options.file);
      console.log(`📄 File format: ${format.toUpperCase()}`);

      // Validate structure
      if (options.headers) {
        const expectedHeaders = options.headers.split(',').map((h: string) => h.trim());
        const isValid = validateFileStructure(options.file, expectedHeaders);
        
        if (isValid) {
          console.log('✅ File structure is valid');
        } else {
          console.log('❌ File structure is invalid');
          process.exit(1);
        }
      } else {
        console.log('ℹ️ No headers specified for validation');
      }

    } catch (error) {
      console.error('❌ Validation failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function detectFileFormat(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'csv':
      return 'csv';
    case 'xlsx':
      return 'xlsx';
    case 'xls':
      return 'xls';
    default:
      throw new Error(`Unsupported file extension: ${ext}`);
  }
}

function getConfiguration(
  configType: string, 
  format: string, 
  options: any
): DataProcessingConfig {
  let validationRules: any[] = [];
  let cleaningRules: any[] = [];

  // Use pre-built configurations
  if (configType === 'products') {
    validationRules = ProductDataConfig.validationRules || [];
    cleaningRules = ProductDataConfig.cleaningRules || [];
  } else if (configType === 'users') {
    validationRules = UserDataConfig.validationRules || [];
    cleaningRules = UserDataConfig.cleaningRules || [];
  }

  return {
    format: format as any,
    filePath: options.file,
    tableName: options.table,
    batchSize: parseInt(options.batchSize),
    maxErrors: parseInt(options.maxErrors),
    skipEmptyRows: options.skipEmpty,
    skipRowsWithError: options.skipErrors,
    useTransaction: options.useTransaction,
    parallelInserts: parseInt(options.parallel),
    conflictResolution: options.conflict,
    validationRules,
    cleaningRules
  };
}

function validateFileStructure(filePath: string, expectedHeaders: string[]): boolean {
  try {
    const format = detectFileFormat(filePath);
    
    if (format === 'csv') {
      // Simple CSV header validation
      const fs = require('fs');
      const firstLine = fs.readFileSync(filePath, 'utf8').split('\n')[0];
      const headers = firstLine.split(',').map((h: string) => h.trim());
      return expectedHeaders.every(header => headers.includes(header));
    } else if (format === 'xlsx' || format === 'xls') {
      // Excel header validation
      const XLSX = require('xlsx');
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      const headers = jsonData[0] as string[];
      return expectedHeaders.every(header => headers.includes(header));
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

function displayResults(result: any): void {
  console.log('\n📊 Processing Results:');
  console.log('=====================');
  console.log(`✅ Success: ${result.success}`);
  console.log(`📈 Total Rows: ${result.metrics.totalRows}`);
  console.log(`✅ Processed: ${result.metrics.processedRows}`);
  console.log(`❌ Errors: ${result.metrics.errorRows}`);
  console.log(`⏭️ Skipped: ${result.metrics.skippedRows}`);
  console.log(`⚡ Rate: ${result.metrics.processingRate.toFixed(2)} rows/second`);
  console.log(`⏱️ Duration: ${result.metrics.duration}ms`);
  
  if (result.errors && result.errors.length > 0) {
    console.log('\n❌ Errors:');
    result.errors.forEach((error: string) => console.log(`  - ${error}`));
  }
  
  if (result.warnings && result.warnings.length > 0) {
    console.log('\n⚠️ Warnings:');
    result.warnings.forEach((warning: string) => console.log(`  - ${warning}`));
  }
}

function displayDirectoryResults(results: any[]): void {
  console.log('\n📊 Directory Processing Results:');
  console.log('================================');
  
  const totalFiles = results.length;
  const successfulFiles = results.filter(r => r.success).length;
  const failedFiles = totalFiles - successfulFiles;
  
  console.log(`📁 Total Files: ${totalFiles}`);
  console.log(`✅ Successful: ${successfulFiles}`);
  console.log(`❌ Failed: ${failedFiles}`);
  
  let totalRows = 0;
  let totalProcessed = 0;
  let totalErrors = 0;
  
  results.forEach((result, index) => {
    if (result.success) {
      totalRows += result.metrics.totalRows;
      totalProcessed += result.metrics.processedRows;
      totalErrors += result.metrics.errorRows;
    }
  });
  
  console.log(`📈 Total Rows: ${totalRows}`);
  console.log(`✅ Total Processed: ${totalProcessed}`);
  console.log(`❌ Total Errors: ${totalErrors}`);
  
  if (failedFiles > 0) {
    console.log('\n❌ Failed Files:');
    results.forEach((result, index) => {
      if (!result.success) {
        console.log(`  - File ${index + 1}: ${result.errors?.join(', ')}`);
      }
    });
  }
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

function showUsageExamples(): void {
  console.log('\n📖 Usage Examples:');
  console.log('==================');
  console.log('');
  console.log('Process a CSV file:');
  console.log('  npm run data:process -- --file=./data/products.csv --table=products');
  console.log('');
  console.log('Process an Excel file with custom config:');
  console.log('  npm run data:process -- --file=./data/users.xlsx --table=users --config=users');
  console.log('');
  console.log('Process entire directory:');
  console.log('  npm run data:process-dir -- --directory=./data --table=products');
  console.log('');
  console.log('Generate sample files:');
  console.log('  npm run data:generate -- --output=./data --rows=5000');
  console.log('');
  console.log('Validate file structure:');
  console.log('  npm run data:validate -- --file=./data/products.csv --headers="id,name,price"');
}

// Add help command
program
  .command('examples')
  .description('Show usage examples')
  .action(() => {
    showUsageExamples();
  });

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
  showUsageExamples();
}

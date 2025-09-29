import { z } from 'zod';

export interface SchemaTestCase<T = unknown> {
  name: string;
  data: T;
  expected: 'valid' | 'invalid';
  expectedErrors?: string[];
  description?: string;
}

export interface SchemaTestSuite<T = unknown> {
  schema: z.ZodSchema<T>;
  name: string;
  description?: string;
  testCases: SchemaTestCase<T>[];
  setup?: () => void | Promise<void>;
  teardown?: () => void | Promise<void>;
}

export interface SchemaTestResult {
  suiteName: string;
  totalTests: number;
  passed: number;
  failed: number;
  duration: number;
  results: Array<{
    testName: string;
    passed: boolean;
    error?: string;
    duration: number;
  }>;
}

export class SchemaTestingUtils {
  /**
   * Create a comprehensive test suite for a schema
   */
  static createTestSuite<T>(
    schema: z.ZodSchema<T>,
    name: string,
    testCases: SchemaTestCase<T>[],
    options?: {
      description?: string;
      setup?: () => void | Promise<void>;
      teardown?: () => void | Promise<void>;
    }
  ): SchemaTestSuite<T> {
    return {
      schema,
      name,
      description: options?.description || '',
      testCases,
      setup: options?.setup,
      teardown: options?.teardown
    } as SchemaTestSuite<T>;
  }

  /**
   * Run a test suite and return results
   */
  static async runTestSuite<T>(suite: SchemaTestSuite<T>): Promise<SchemaTestResult> {
    const startTime = performance.now();
    const results: Array<{
      testName: string;
      passed: boolean;
      error?: string;
      duration: number;
    }> = [];

    // Setup
    if (suite.setup) {
      await suite.setup();
    }

    // Run tests
    for (const testCase of suite.testCases) {
      const testStartTime = performance.now();
      
      try {
        suite.schema.parse(testCase.data);
        
        if (testCase.expected === 'valid') {
          results.push({
            testName: testCase.name,
            passed: true,
            duration: performance.now() - testStartTime
          });
        } else {
          results.push({
            testName: testCase.name,
            passed: false,
            error: 'Expected validation to fail but it passed',
            duration: performance.now() - testStartTime
          });
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          if (testCase.expected === 'invalid') {
            // Check if expected errors match
            const actualErrors = error.issues.map(issue => issue.message);
            const expectedErrors = testCase.expectedErrors || [];
            
            const errorsMatch = expectedErrors.length === 0 || 
              expectedErrors.every(expectedError => 
                actualErrors.some(actualError => actualError.includes(expectedError))
              );
            
            results.push({
              testName: testCase.name,
              passed: errorsMatch,
              ...(errorsMatch ? {} : { error: `Expected errors: ${expectedErrors.join(', ')}, Got: ${actualErrors.join(', ')}` }),
              duration: performance.now() - testStartTime
            });
          } else {
            results.push({
              testName: testCase.name,
              passed: false,
              error: `Expected validation to pass but it failed: ${error.issues.map(i => i.message).join(', ')}`,
              duration: performance.now() - testStartTime
            });
          }
        } else {
          results.push({
            testName: testCase.name,
            passed: false,
            error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            duration: performance.now() - testStartTime
          });
        }
      }
    }

    // Teardown
    if (suite.teardown) {
      await suite.teardown();
    }

    const duration = performance.now() - startTime;
    const passed = results.filter(r => r.passed).length;
    const failed = results.length - passed;

    return {
      suiteName: suite.name,
      totalTests: suite.testCases.length,
      passed,
      failed,
      duration,
      results
    };
  }

  /**
   * Generate test cases from schema definition
   */
  static generateTestCases<T>(schema: z.ZodSchema<T>): SchemaTestCase<T>[] {
    const testCases: SchemaTestCase<T>[] = [];
    
    // Generate valid test cases
    testCases.push({
      name: 'valid_minimal',
      data: this.generateValidData(schema),
      expected: 'valid',
      description: 'Minimal valid data'
    });

    // Generate invalid test cases
    testCases.push({
      name: 'invalid_null',
      data: null as unknown as T,
      expected: 'invalid',
      expectedErrors: ['Expected'],
      description: 'Null value should be invalid'
    });

    testCases.push({
      name: 'invalid_undefined',
      data: undefined as unknown as T,
      expected: 'invalid',
      expectedErrors: ['Expected'],
      description: 'Undefined value should be invalid'
    });

    testCases.push({
      name: 'invalid_wrong_type',
      data: 'string' as unknown as T,
      expected: 'invalid',
      expectedErrors: ['Expected'],
      description: 'Wrong type should be invalid'
    });

    return testCases;
  }

  /**
   * Generate valid test data for a schema
   */
  static generateValidData<T>(schema: z.ZodSchema<T>): T {
    // This is a simplified implementation
    // In practice, this would use more sophisticated data generation
    if (schema instanceof z.ZodObject) {
      const data: Record<string, unknown> = {};
      for (const [key, fieldSchema] of Object.entries(schema.shape)) {
        data[key] = this.generateFieldData(fieldSchema as z.ZodSchema);
      }
      return data as unknown as T;
    }
    
    if (schema instanceof z.ZodString) {
      return 'test string' as T;
    }
    
    if (schema instanceof z.ZodNumber) {
      return 42 as T;
    }
    
    if (schema instanceof z.ZodBoolean) {
      return true as T;
    }
    
    if (schema instanceof z.ZodArray) {
      return [this.generateFieldData(schema.element as z.ZodSchema)] as unknown as T;
    }
    
    return {} as unknown as T;
  }

  /**
   * Generate test data for a specific field
   */
  private static generateFieldData(fieldSchema: z.ZodSchema): unknown {
    if (fieldSchema instanceof z.ZodString) {
      return 'test string';
    }
    
    if (fieldSchema instanceof z.ZodNumber) {
      return 42;
    }
    
    if (fieldSchema instanceof z.ZodBoolean) {
      return true;
    }
    
    if (fieldSchema instanceof z.ZodArray) {
      return [this.generateFieldData(fieldSchema.element)];
    }
    
    if (fieldSchema instanceof z.ZodObject) {
      const data: Record<string, unknown> = {};
      for (const [key, subFieldSchema] of Object.entries(fieldSchema.shape)) {
        data[key] = this.generateFieldData(subFieldSchema as z.ZodSchema);
      }
      return data;
    }
    
    if (fieldSchema instanceof z.ZodOptional) {
      return this.generateFieldData(fieldSchema.unwrap());
    }
    
    if (fieldSchema instanceof z.ZodNullable) {
      return this.generateFieldData(fieldSchema.unwrap());
    }
    
    return null;
  }

  /**
   * Create a mock schema for testing
   */
  static createMockSchema<T>(data: T): z.ZodSchema<T> {
    return z.literal(data as unknown as z.LiteralValue) as unknown as z.ZodSchema<T>;
  }

  /**
   * Create a test schema with specific constraints
   */
  static createTestSchema(constraints: {
    required?: string[];
    optional?: string[];
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    min?: number;
    max?: number;
  }): z.ZodSchema {
    let schema = z.object({});
    
    if (constraints.required) {
      for (const field of constraints.required) {
        schema = schema.extend({
          [field]: z.string()
        });
      }
    }
    
    if (constraints.optional) {
      for (const field of constraints.optional) {
        schema = schema.extend({
          [field]: z.string().optional()
        });
      }
    }
    
    if (constraints.minLength) {
      schema = schema.refine((data) => {
        for (const [_key, value] of Object.entries(data)) {
          if (typeof value === 'string' && value.length < constraints.minLength!) {
            return false;
          }
        }
        return true;
      }, `Fields must be at least ${constraints.minLength} characters`) as unknown as z.ZodSchema;
    }
    
    if (constraints.maxLength) {
      schema = schema.refine((data) => {
        for (const [_key, value] of Object.entries(data)) {
          if (typeof value === 'string' && value.length > constraints.maxLength!) {
            return false;
          }
        }
        return true;
      }, `Fields must be at most ${constraints.maxLength} characters`) as unknown as z.ZodSchema;
    }
    
    if (constraints.pattern) {
      schema = schema.refine((data) => {
        for (const [_key, value] of Object.entries(data)) {
          if (typeof value === 'string' && !constraints.pattern!.test(value)) {
            return false;
          }
        }
        return true;
      }, `Fields must match required pattern`) as unknown as z.ZodSchema;
    }
    
    if (constraints.min) {
      schema = schema.refine((data) => {
        for (const [_key, value] of Object.entries(data)) {
          if (typeof value === 'number' && value < constraints.min!) {
            return false;
          }
        }
        return true;
      }, `Fields must be at least ${constraints.min}`) as unknown as z.ZodSchema;
    }
    
    if (constraints.max) {
      schema = schema.refine((data) => {
        for (const [_key, value] of Object.entries(data)) {
          if (typeof value === 'number' && value > constraints.max!) {
            return false;
          }
        }
        return true;
      }, `Fields must be at most ${constraints.max}`) as unknown as z.ZodSchema;
    }
    
    return schema;
  }

  /**
   * Benchmark schema validation performance
   */
  static async benchmarkSchema<T>(
    schema: z.ZodSchema<T>,
    testData: T[],
    iterations = 1000
  ): Promise<{
    averageTime: number;
    minTime: number;
    maxTime: number;
    totalTime: number;
    iterations: number;
  }> {
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const data = testData[i % testData.length];
      const startTime = performance.now();
      
      try {
        schema.parse(data);
      } catch {
        // Ignore validation errors for benchmarking
      }
      
      times.push(performance.now() - startTime);
    }
    
    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const averageTime = totalTime / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    return {
      averageTime,
      minTime,
      maxTime,
      totalTime,
      iterations
    };
  }

  /**
   * Create a test report
   */
  static generateTestReport(results: SchemaTestResult[]): string {
    let report = '# Schema Test Report\n\n';
    
    for (const result of results) {
      report += `## ${result.suiteName}\n\n`;
      report += `- **Total Tests:** ${result.totalTests}\n`;
      report += `- **Passed:** ${result.passed}\n`;
      report += `- **Failed:** ${result.failed}\n`;
      report += `- **Duration:** ${result.duration.toFixed(2)}ms\n\n`;
      
      if (result.failed > 0) {
        report += `### Failed Tests\n\n`;
        for (const testResult of result.results) {
          if (!testResult.passed) {
            report += `- **${testResult.testName}**: ${testResult.error}\n`;
          }
        }
        report += '\n';
      }
    }
    
    return report;
  }
}

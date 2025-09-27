import { z } from 'zod';

export interface ValidationErrorContext {
  schema: string;
  data: any;
  path: string[];
  timestamp: Date;
  requestId?: string;
  userId?: string;
  endpoint?: string;
  method?: string;
}

export interface ErrorAnalysis {
  errorType: 'validation' | 'transformation' | 'refinement' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  frequency: number;
  commonPatterns: string[];
  suggestions: string[];
  affectedFields: string[];
}

export interface DebugInfo {
  schemaDefinition: string;
  dataStructure: string;
  errorPath: string[];
  expectedType: string;
  actualType: string;
  suggestedFix: string;
  relatedSchemas: string[];
}

export class SchemaErrorDebugger {
  private static errorHistory: Array<{
    error: z.ZodError;
    context: ValidationErrorContext;
    timestamp: Date;
  }> = [];

  /**
   * Analyze a Zod error and provide debugging information
   */
  static analyzeError(error: z.ZodError, context: ValidationErrorContext): DebugInfo {
    const issue = error.issues[0]; // Focus on first issue
    if (!issue) {
      throw new Error('No issues found in ZodError');
    }
    
    const schemaDefinition = this.extractSchemaDefinition(context.schema);
    const dataStructure = this.extractDataStructure(context.data);
    
    return {
      schemaDefinition,
      dataStructure,
      errorPath: issue.path.map(p => String(p)),
      expectedType: this.getExpectedType(issue),
      actualType: this.getActualType(context.data, issue.path.map(p => String(p))),
      suggestedFix: this.generateSuggestedFix(issue, context),
      relatedSchemas: this.findRelatedSchemas(context.schema)
    };
  }

  /**
   * Get error analysis for debugging
   */
  static getErrorAnalysis(schemaName: string, timeRange?: { start: Date; end: Date }): ErrorAnalysis {
    const relevantErrors = this.errorHistory.filter(entry => 
      entry.context.schema === schemaName &&
      (!timeRange || (entry.timestamp >= timeRange.start && entry.timestamp <= timeRange.end))
    );

    if (relevantErrors.length === 0) {
      return {
        errorType: 'unknown',
        severity: 'low',
        frequency: 0,
        commonPatterns: [],
        suggestions: [],
        affectedFields: []
      };
    }

    const errorTypes = relevantErrors.map(entry => this.categorizeError(entry.error));
    const errorType = this.getMostCommonErrorType(errorTypes);
    const severity = this.calculateSeverity(relevantErrors);
    const frequency = relevantErrors.length;
    const commonPatterns = this.extractCommonPatterns(relevantErrors);
    const suggestions = this.generateSuggestions(errorType, commonPatterns);
    const affectedFields = this.extractAffectedFields(relevantErrors);

    return {
      errorType,
      severity,
      frequency,
      commonPatterns,
      suggestions,
      affectedFields
    };
  }

  /**
   * Record an error for analysis
   */
  static recordError(error: z.ZodError, context: ValidationErrorContext): void {
    this.errorHistory.push({
      error,
      context,
      timestamp: new Date()
    });

    // Keep only last 1000 errors
    if (this.errorHistory.length > 1000) {
      this.errorHistory = this.errorHistory.slice(-1000);
    }
  }

  /**
   * Generate a detailed error report
   */
  static generateErrorReport(schemaName: string): string {
    const analysis = this.getErrorAnalysis(schemaName);
    const recentErrors = this.errorHistory
      .filter(entry => entry.context.schema === schemaName)
      .slice(-10);

    let report = `# Error Report for ${schemaName}\n\n`;
    
    report += `## Summary\n`;
    report += `- **Total Errors:** ${analysis.frequency}\n`;
    report += `- **Error Type:** ${analysis.errorType}\n`;
    report += `- **Severity:** ${analysis.severity}\n`;
    report += `- **Affected Fields:** ${analysis.affectedFields.join(', ')}\n\n`;
    
    if (analysis.commonPatterns.length > 0) {
      report += `## Common Patterns\n`;
      for (const pattern of analysis.commonPatterns) {
        report += `- ${pattern}\n`;
      }
      report += '\n';
    }
    
    if (analysis.suggestions.length > 0) {
      report += `## Suggestions\n`;
      for (const suggestion of analysis.suggestions) {
        report += `- ${suggestion}\n`;
      }
      report += '\n';
    }
    
    if (recentErrors.length > 0) {
      report += `## Recent Errors\n`;
      for (const entry of recentErrors) {
        const debugInfo = this.analyzeError(entry.error, entry.context);
        report += `### ${entry.timestamp.toISOString()}\n`;
        report += `- **Path:** ${debugInfo.errorPath.join('.')}\n`;
        report += `- **Expected:** ${debugInfo.expectedType}\n`;
        report += `- **Actual:** ${debugInfo.actualType}\n`;
        report += `- **Suggestion:** ${debugInfo.suggestedFix}\n\n`;
      }
    }
    
    return report;
  }

  /**
   * Create a user-friendly error message
   */
  static createUserFriendlyMessage(error: z.ZodError, _context: ValidationErrorContext): string {
    const issue = error.issues[0];
    if (!issue) {
      return 'Validation error occurred';
    }
    
    const fieldPath = issue.path.map(p => String(p)).join('.');
    const fieldName = fieldPath || 'field';
    
    let message = `Validation error in ${fieldName}: `;
    
    switch (issue.code) {
      case 'invalid_type':
        message += `Expected ${issue.expected}, received ${issue.received}`;
        break;
      case 'too_small':
        if (issue.type === 'string') {
          message += `String must be at least ${issue.minimum} characters long`;
        } else if (issue.type === 'number') {
          message += `Number must be at least ${issue.minimum}`;
        } else {
          message += `Value is too small`;
        }
        break;
      case 'too_big':
        if (issue.type === 'string') {
          message += `String must be at most ${issue.maximum} characters long`;
        } else if (issue.type === 'number') {
          message += `Number must be at most ${issue.maximum}`;
        } else {
          message += `Value is too large`;
        }
        break;
      case 'invalid_string':
        if (issue.validation === 'email') {
          message += `Invalid email format`;
        } else if (issue.validation === 'url') {
          message += `Invalid URL format`;
        } else if (issue.validation === 'uuid') {
          message += `Invalid UUID format`;
        } else {
          message += `Invalid string format`;
        }
        break;
      case 'invalid_enum_value':
        message += `Invalid value. Expected one of: ${issue.options.join(', ')}`;
        break;
      case 'custom':
        message += issue.message || 'Custom validation failed';
        break;
      default:
        message += issue.message || 'Validation failed';
    }
    
    return message;
  }

  /**
   * Extract schema definition for debugging
   */
  private static extractSchemaDefinition(schema: string): string {
    // This would extract the actual schema definition
    // For now, return a placeholder
    return `Schema: ${schema}`;
  }

  /**
   * Extract data structure for debugging
   */
  private static extractDataStructure(data: any): string {
    if (data === null) return 'null';
    if (data === undefined) return 'undefined';
    if (typeof data === 'string') return `string (length: ${data.length})`;
    if (typeof data === 'number') return `number (${data})`;
    if (typeof data === 'boolean') return `boolean (${data})`;
    if (Array.isArray(data)) return `array (length: ${data.length})`;
    if (typeof data === 'object') return `object (keys: ${Object.keys(data).join(', ')})`;
    return typeof data;
  }

  /**
   * Get expected type from Zod issue
   */
  private static getExpectedType(issue: z.ZodIssue): string {
    switch (issue.code) {
      case 'invalid_type':
        return (issue as any).expected || 'unknown';
      case 'too_small':
      case 'too_big':
        return (issue as any).type || 'unknown';
      case 'invalid_string':
        return `string (${(issue as any).validation || 'unknown'})`;
      case 'invalid_enum_value':
        return `enum (${(issue as any).options?.join(' | ') || 'unknown'})`;
      default:
        return 'unknown';
    }
  }

  /**
   * Get actual type from data
   */
  private static getActualType(data: any, path: string[]): string {
    let current = data;
    for (const key of path) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return 'undefined';
      }
    }
    
    if (current === null) return 'null';
    if (current === undefined) return 'undefined';
    return typeof current;
  }

  /**
   * Generate suggested fix
   */
  private static generateSuggestedFix(issue: z.ZodIssue, _context: ValidationErrorContext): string {
    switch (issue.code) {
      case 'invalid_type':
        return `Change the value to be of type ${(issue as any).expected || 'unknown'}`;
      case 'too_small':
        if ((issue as any).type === 'string') {
          return `Make the string at least ${(issue as any).minimum || 'unknown'} characters long`;
        } else if ((issue as any).type === 'number') {
          return `Use a number that is at least ${(issue as any).minimum || 'unknown'}`;
        }
        break;
      case 'too_big':
        if ((issue as any).type === 'string') {
          return `Make the string at most ${(issue as any).maximum || 'unknown'} characters long`;
        } else if ((issue as any).type === 'number') {
          return `Use a number that is at most ${(issue as any).maximum || 'unknown'}`;
        }
        break;
      case 'invalid_string':
        if ((issue as any).validation === 'email') {
          return `Use a valid email format (e.g., user@example.com)`;
        } else if ((issue as any).validation === 'url') {
          return `Use a valid URL format (e.g., https://example.com)`;
        } else if ((issue as any).validation === 'uuid') {
          return `Use a valid UUID format (e.g., 123e4567-e89b-12d3-a456-426614174000)`;
        }
        break;
      case 'invalid_enum_value':
        return `Use one of the allowed values: ${(issue as any).options?.join(', ') || 'unknown'}`;
      case 'custom':
        return issue.message || 'Fix the custom validation error';
    }
    
    return 'Check the validation rules and fix the error';
  }

  /**
   * Find related schemas
   */
  private static findRelatedSchemas(_schema: string): string[] {
    // This would find related schemas based on dependencies
    // For now, return empty array
    return [];
  }

  /**
   * Categorize error type
   */
  private static categorizeError(error: z.ZodError): 'validation' | 'transformation' | 'refinement' | 'unknown' {
    const issue = error.issues[0];
    if (!issue) {
      return 'unknown';
    }
    
    switch (issue.code) {
      case 'invalid_type':
      case 'too_small':
      case 'too_big':
      case 'invalid_string':
      case 'invalid_enum_value':
        return 'validation';
      case 'custom':
        return 'refinement';
      default:
        return 'unknown';
    }
  }

  /**
   * Get most common error type
   */
  private static getMostCommonErrorType(errorTypes: string[]): 'validation' | 'transformation' | 'refinement' | 'unknown' {
    const counts = errorTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostCommon = Object.entries(counts).reduce((a, b) => (counts[a[0]] || 0) > (counts[b[0]] || 0) ? a : b);
    return (mostCommon[0] as any) || 'unknown';
  }

  /**
   * Calculate error severity
   */
  private static calculateSeverity(errors: Array<{ error: z.ZodError; context: ValidationErrorContext }>): 'low' | 'medium' | 'high' | 'critical' {
    const count = errors.length;
    
    if (count < 5) return 'low';
    if (count < 20) return 'medium';
    if (count < 50) return 'high';
    return 'critical';
  }

  /**
   * Extract common patterns from errors
   */
  private static extractCommonPatterns(errors: Array<{ error: z.ZodError; context: ValidationErrorContext }>): string[] {
    const patterns: string[] = [];
    const errorCodes = errors.map(e => e.error.issues[0]?.code || 'unknown');
    const errorPaths = errors.map(e => e.error.issues[0]?.path.map(p => String(p)).join('.') || 'unknown');
    
    // Find most common error codes
    const codeCounts = errorCodes.reduce((acc, code) => {
      acc[code] = (acc[code] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const commonCodes = Object.entries(codeCounts)
      .filter(([_, count]) => count > 1)
      .map(([code, count]) => `${code} (${count} times)`);
    
    patterns.push(...commonCodes);
    
    // Find most common error paths
    const pathCounts = errorPaths.reduce((acc, path) => {
      acc[path] = (acc[path] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const commonPaths = Object.entries(pathCounts)
      .filter(([_, count]) => count > 1)
      .map(([path, count]) => `path: ${path} (${count} times)`);
    
    patterns.push(...commonPaths);
    
    return patterns;
  }

  /**
   * Generate suggestions based on error analysis
   */
  private static generateSuggestions(errorType: string, patterns: string[]): string[] {
    const suggestions: string[] = [];
    
    if (errorType === 'validation') {
      suggestions.push('Check data types and format requirements');
      suggestions.push('Verify required fields are present');
    }
    
    if (patterns.some(p => p.includes('invalid_type'))) {
      suggestions.push('Add type checking before validation');
      suggestions.push('Consider using union types for multiple valid types');
    }
    
    if (patterns.some(p => p.includes('too_small') || p.includes('too_big'))) {
      suggestions.push('Add length/size validation on the client side');
      suggestions.push('Consider using more lenient constraints');
    }
    
    if (patterns.some(p => p.includes('invalid_string'))) {
      suggestions.push('Add format validation on the client side');
      suggestions.push('Provide better error messages for format requirements');
    }
    
    return suggestions;
  }

  /**
   * Extract affected fields from errors
   */
  private static extractAffectedFields(errors: Array<{ error: z.ZodError; context: ValidationErrorContext }>): string[] {
    const fields = errors.map(e => e.error.issues[0]?.path.map(p => String(p)).join('.') || 'unknown');
    return [...new Set(fields)];
  }
}

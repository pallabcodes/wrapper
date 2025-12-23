/**
 * Type-Safe Error Handling Utilities
 * 
 * This module provides type-safe alternatives to error handling operations
 * that previously required `any` assertions. It safely accesses Zod's internal
 * error structures while maintaining type safety.
 */

import { z } from 'zod';
import {
  // ZodIssueInternal, // Not used directly
  SafeErrorContext,
  SafeErrorMessage,
  isZodIssueInternal,
  // getSafeErrorContext, // Not used directly
  createSafeErrorMessage,
} from '../types/zod-internal.types';

// ============================================================================
// Type-Safe Error Analysis
// ============================================================================

export class TypeSafeErrorAnalyzer {
  /**
   * Analyze Zod error with type safety
   */
  static analyzeError(error: z.ZodError): {
    issues: SafeErrorMessage[];
    summary: {
      totalIssues: number;
      issueTypes: Record<string, number>;
      severity: 'low' | 'medium' | 'high' | 'critical';
    };
    suggestions: string[];
  } {
    const issues: SafeErrorMessage[] = [];
    const issueTypes: Record<string, number> = {};
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

    for (const issue of error.issues) {
      if (issue) {
        const safeIssue = this.createSafeIssue(issue);
        issues.push(safeIssue);
        
        // Count issue types
        issueTypes[issue.code] = (issueTypes[issue.code] || 0) + 1;
        
        // Determine severity
        severity = this.determineSeverity(issue.code, severity);
      }
    }

    return {
      issues,
      summary: {
        totalIssues: issues.length,
        issueTypes,
        severity,
      },
      suggestions: this.generateSuggestions(issues),
    };
  }

  /**
   * Create safe issue from Zod issue
   */
  private static createSafeIssue(issue: z.ZodIssue): SafeErrorMessage {
    if (isZodIssueInternal(issue)) {
      return createSafeErrorMessage(issue);
    }

    // Fallback for standard Zod issues
    return {
      message: issue.message,
      context: {
        expected: this.safeGetProperty(issue, 'expected'),
        received: this.safeGetProperty(issue, 'received'),
        validation: this.safeGetProperty(issue, 'validation'),
        options: this.safeGetProperty(issue, 'options'),
        minimum: this.safeGetProperty(issue, 'minimum'),
        maximum: this.safeGetProperty(issue, 'maximum'),
        type: this.safeGetProperty(issue, 'type'),
        context: this.safeGetProperty(issue, 'context'),
      } as SafeErrorContext,
    };
  }

  /**
   * Safely get property from object
   */
  private static safeGetProperty<T>(obj: unknown, key: string): T | undefined {
    try {
      if (obj && typeof obj === 'object' && key in (obj as Record<string, unknown>)) {
        return (obj as Record<string, unknown>)[key] as T;
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Determine error severity
   */
  private static determineSeverity(
    code: z.ZodIssueCode,
    currentSeverity: 'low' | 'medium' | 'high' | 'critical'
  ): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: Record<z.ZodIssueCode, 'low' | 'medium' | 'high' | 'critical'> = {
      'invalid_type': 'high',
      'invalid_literal': 'high',
      'custom': 'medium',
      'invalid_union': 'high',
      'invalid_union_discriminator': 'high',
      'invalid_enum_value': 'medium',
      'unrecognized_keys': 'low',
      'invalid_arguments': 'high',
      'invalid_return_type': 'high',
      'invalid_date': 'medium',
      'invalid_string': 'medium',
      'too_small': 'medium',
      'too_big': 'medium',
      'invalid_intersection_types': 'high',
      'not_multiple_of': 'medium',
      'not_finite': 'high',
    };

    const issueSeverity = severityMap[code] || 'low';
    
    const severityLevels = { low: 0, medium: 1, high: 2, critical: 3 };
    return severityLevels[issueSeverity] > severityLevels[currentSeverity] 
      ? issueSeverity 
      : currentSeverity;
  }

  /**
   * Generate suggestions based on issues
   */
  private static generateSuggestions(issues: SafeErrorMessage[]): string[] {
    const suggestions: string[] = [];
    const issueCounts: Record<string, number> = {};

    // Count common issues
    for (const issue of issues) {
      const key = `${issue.context.type || 'unknown'}_${issue.context.validation || 'unknown'}`;
      issueCounts[key] = (issueCounts[key] || 0) + 1;
    }

    // Generate suggestions based on common patterns
    for (const [pattern, count] of Object.entries(issueCounts)) {
      if (count > 1) {
        suggestions.push(`Multiple ${pattern} errors detected. Consider validating this field separately.`);
      }
    }

    // Add specific suggestions based on issue types
    const hasTypeErrors = issues.some(issue => issue.context.expected && issue.context.received);
    if (hasTypeErrors) {
      suggestions.push('Check data types - ensure all fields match their expected types.');
    }

    const hasValidationErrors = issues.some(issue => issue.context.validation);
    if (hasValidationErrors) {
      suggestions.push('Review validation rules - some fields may not meet format requirements.');
    }

    const hasSizeErrors = issues.some(issue => issue.context.minimum || issue.context.maximum);
    if (hasSizeErrors) {
      suggestions.push('Check field lengths and numeric ranges.');
    }

    return suggestions;
  }
}

// ============================================================================
// Type-Safe Error Formatting
// ============================================================================

export class TypeSafeErrorFormatter {
  /**
   * Format error for user display
   */
  static formatForUser(error: z.ZodError, options: {
    includePath?: boolean;
    includeContext?: boolean;
    maxIssues?: number;
  } = {}): string {
    const { includePath = true, includeContext = true, maxIssues = 10 } = options;
    const analysis = TypeSafeErrorAnalyzer.analyzeError(error);
    
    let message = `Validation failed with ${analysis.summary.totalIssues} error(s):\n\n`;
    
    const issuesToShow = analysis.issues.slice(0, maxIssues);
    
    for (let i = 0; i < issuesToShow.length; i++) {
      const issue = issuesToShow[i];
      if (issue) {
        message += `${i + 1}. ${issue.message}`;
        
        if (includePath && error.issues[i]) {
          const zodIssue = error.issues[i];
          if (zodIssue) {
            const path = zodIssue.path.length > 0 
              ? ` at ${zodIssue.path.join('.')}`
              : '';
            message += path;
          }
        }
        
        if (includeContext && issue.context.expected && issue.context.received) {
          message += ` (expected: ${issue.context.expected}, received: ${issue.context.received})`;
        }
        
        message += '\n';
      }
    }
    
    if (analysis.issues.length > maxIssues) {
      message += `\n... and ${analysis.issues.length - maxIssues} more errors.\n`;
    }
    
    if (analysis.suggestions.length > 0) {
      message += '\nSuggestions:\n';
      for (const suggestion of analysis.suggestions) {
        message += `- ${suggestion}\n`;
      }
    }
    
    return message;
  }

  /**
   * Format error for logging
   */
  static formatForLogging(error: z.ZodError, context: {
    requestId?: string;
    userId?: string;
    endpoint?: string;
  } = {}): {
    message: string;
    severity: string;
    context: Record<string, unknown>;
    issues: Array<{
      code: string;
      path: string[];
      message: string;
      context: SafeErrorContext;
    }>;
  } {
    const analysis = TypeSafeErrorAnalyzer.analyzeError(error);
    
    return {
      message: `Validation failed: ${error.issues.length} error(s)`,
      severity: analysis.summary.severity,
      context: {
        requestId: context.requestId,
        userId: context.userId,
        endpoint: context.endpoint,
        totalIssues: analysis.summary.totalIssues,
        issueTypes: analysis.summary.issueTypes,
      },
      issues: error.issues.map((issue, index) => ({
        code: issue.code as string,
        path: issue.path as string[],
        message: issue.message,
        context: analysis.issues[index]?.context || {},
      })),
    };
  }

  /**
   * Format error for API response
   */
  static formatForAPI(error: z.ZodError, options: {
    includeDetails?: boolean;
    includeSuggestions?: boolean;
  } = {}): {
    error: string;
    message: string;
    details?: Array<{
      field: string;
      code: string;
      message: string;
      expected?: string;
      received?: string;
    }>;
    suggestions?: string[];
  } {
    const analysis = TypeSafeErrorAnalyzer.analyzeError(error);
    
    const response: {
      error: string;
      message: string;
      details?: Array<{ field: string; code: string; message: string; expected?: string; received?: string }>;
      suggestions?: string[];
    } = {
      error: 'ValidationError',
      message: `Validation failed with ${analysis.summary.totalIssues} error(s)`,
    };
    
    if (options.includeDetails) {
      response.details = error.issues.map((issue, index) => {
        const detail: {
          field: string;
          code: string;
          message: string;
          expected?: string;
          received?: string;
        } = {
          field: issue.path.length > 0 ? issue.path.join('.') : 'root',
          code: issue.code,
          message: issue.message,
        };
        
        const expected = analysis.issues[index]?.context.expected;
        const received = analysis.issues[index]?.context.received;
        
        if (expected !== undefined) {
          detail.expected = expected;
        }
        if (received !== undefined) {
          detail.received = received;
        }
        
        return detail;
      });
    }
    
    if (options.includeSuggestions && analysis.suggestions.length > 0) {
      response.suggestions = analysis.suggestions;
    }
    
    return response;
  }
}

// ============================================================================
// Type-Safe Error Recovery
// ============================================================================

export class TypeSafeErrorRecovery {
  /**
   * Attempt to recover from validation errors
   */
  static attemptRecovery<T>(
    data: unknown,
    schema: z.ZodSchema<T>,
    error: z.ZodError
  ): {
    recovered: boolean;
    data?: T;
    remainingErrors?: z.ZodError;
  } {
    try {
      // Try to fix common issues
      const fixedData = this.fixCommonIssues(data, error);
      
      // Validate the fixed data
      const result = schema.safeParse(fixedData);
      
      if (result.success) {
        return {
          recovered: true,
          data: result.data,
        };
      } else {
        return {
          recovered: false,
          remainingErrors: result.error,
        };
      }
    } catch {
      return {
        recovered: false,
      };
    }
  }

  /**
   * Fix common validation issues
   */
  private static fixCommonIssues(data: unknown, error: z.ZodError): unknown {
    const base = (typeof data === 'object' && data !== null) ? { ...(data as Record<string, unknown>) } : {} as Record<string, unknown>;
    let fixedData: unknown = base;
    
    for (const issue of error.issues) {
      if (issue.code === 'invalid_type') {
        fixedData = this.fixTypeIssues(fixedData, issue);
      } else if (issue.code === 'too_small' || issue.code === 'too_big') {
        fixedData = this.fixSizeIssues(fixedData, issue);
      } else if (issue.code === 'invalid_string') {
        fixedData = this.fixStringIssues(fixedData, issue);
      }
    }
    
    return fixedData;
  }

  /**
   * Fix type-related issues
   */
  private static fixTypeIssues(data: unknown, issue: z.ZodIssue): unknown {
    const path = issue.path;
    if (path.length === 0) return data;
    
    let current: unknown = data;
    for (let i = 0; i < path.length - 1; i++) {
      const pathKey = path[i];
      if (current && typeof current === 'object' && pathKey !== undefined) {
        current = (current as Record<string, unknown>)[pathKey as keyof Record<string, unknown>];
      } else {
        return data;
      }
    }
    
    if (current && typeof current === 'object') {
      const lastKey = path[path.length - 1];
      if (lastKey !== undefined) {
        const value = (current as Record<string, unknown>)[lastKey as keyof Record<string, unknown>];
        
        // Try to convert types
        if (issue.message.includes('expected string')) {
          (current as Record<string, unknown>)[lastKey as keyof Record<string, unknown>] = String(value);
        } else if (issue.message.includes('expected number')) {
          const num = Number(value);
          if (!isNaN(num)) {
            (current as Record<string, unknown>)[lastKey as keyof Record<string, unknown>] = num;
          }
        } else if (issue.message.includes('expected boolean')) {
          (current as Record<string, unknown>)[lastKey as keyof Record<string, unknown>] = Boolean(value);
        }
      }
    }
    
    return data;
  }

  /**
   * Fix size-related issues
   */
  private static fixSizeIssues(data: unknown, _issue: z.ZodIssue): unknown {
    // Size issues are harder to fix automatically
    // Return original data for now
    return data;
  }

  /**
   * Fix string-related issues
   */
  private static fixStringIssues(data: unknown, issue: z.ZodIssue): unknown {
    const path = issue.path;
    if (path.length === 0) return data;
    
    let current: unknown = data;
    for (let i = 0; i < path.length - 1; i++) {
      const pathKey = path[i];
      if (current && typeof current === 'object' && pathKey !== undefined) {
        current = (current as Record<string, unknown>)[pathKey as keyof Record<string, unknown>];
      } else {
        return data;
      }
    }
    
    if (current && typeof current === 'object') {
      const lastKey = path[path.length - 1];
      if (lastKey !== undefined) {
        const value = (current as Record<string, unknown>)[lastKey as keyof Record<string, unknown>];
        
        if (typeof value === 'string') {
          // Try to fix common string issues
          if (issue.message.includes('email')) {
            // Basic email validation fix
            (current as Record<string, unknown>)[lastKey as keyof Record<string, unknown>] = value.toLowerCase().trim();
          } else if (issue.message.includes('url')) {
            // Basic URL validation fix
            if (!value.startsWith('http://') && !value.startsWith('https://')) {
              (current as Record<string, unknown>)[lastKey as keyof Record<string, unknown>] = `https://${value}`;
            }
          }
        }
      }
    }
    
    return data;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Analyze Zod error with type safety
 */
export function analyzeZodError(error: z.ZodError) {
  return TypeSafeErrorAnalyzer.analyzeError(error);
}

/**
 * Format Zod error for user display
 */
export function formatZodErrorForUser(error: z.ZodError, options?: {
  includePath?: boolean;
  includeContext?: boolean;
  maxIssues?: number;
}) {
  return TypeSafeErrorFormatter.formatForUser(error, options);
}

/**
 * Format Zod error for logging
 */
export function formatZodErrorForLogging(error: z.ZodError, context?: {
  requestId?: string;
  userId?: string;
  endpoint?: string;
}) {
  return TypeSafeErrorFormatter.formatForLogging(error, context);
}

/**
 * Format Zod error for API response
 */
export function formatZodErrorForAPI(error: z.ZodError, options?: {
  includeDetails?: boolean;
  includeSuggestions?: boolean;
}) {
  return TypeSafeErrorFormatter.formatForAPI(error, options);
}

/**
 * Attempt to recover from Zod error
 */
export function attemptZodErrorRecovery<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  error: z.ZodError
) {
  return TypeSafeErrorRecovery.attemptRecovery(data, schema, error);
}

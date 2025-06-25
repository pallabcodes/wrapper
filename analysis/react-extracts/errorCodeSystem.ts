/**
 * Error Code System
 * 
 * A pattern used by React to convert error messages into error codes in production builds
 * for smaller bundle sizes while maintaining debuggability.
 */

// Actual code from React's error handling system (simplified but true to the pattern)
import * as fs from 'fs';
import * as path from 'path';

// In development, errors show full messages
// In production, errors show just codes that can be looked up

const ErrorProd = function(code: number): Error {
  const error = new Error();
  error.name = 'Invariant Violation';
  error.message = `Minified error #${code}; visit https://reactjs.org/errors/${code} for details.`;
  return error;
};

const ErrorDev = function(format: string, ...args: any[]): Error {
  const error = new Error(format.replace(/%s/g, () => args.shift()));
  error.name = 'Invariant Violation';
  return error;
};

/**
 * Error message to code mapping system
 * React uses this to track error codes and generate error code documentation
 */
export class ErrorCodeSystem {
  private nextAvailableCode: number;
  private errorMap: Map<string, number>;
  private reverseMap: Map<number, string>;
  private filePath: string;
  
  constructor(options: { filePath?: string, startFrom?: number } = {}) {
    this.nextAvailableCode = options.startFrom || 1000;
    this.errorMap = new Map(); // message -> code
    this.reverseMap = new Map(); // code -> message
    this.filePath = options.filePath || path.join(process.cwd(), 'error-codes.json');
    
    // Load existing error codes if available
    this.loadErrorCodes();
  }
  
  private loadErrorCodes(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
        Object.entries(data).forEach(([message, code]) => {
          this.errorMap.set(message, code as number);
          this.reverseMap.set(code as number, message);
        });
        
        // Find the highest code and set nextAvailableCode
        if (this.errorMap.size > 0) {
          this.nextAvailableCode = Math.max(
            this.nextAvailableCode,
            ...Array.from(this.errorMap.values())
          ) + 1;
        }
      }
    } catch (e) {
      console.warn('Failed to load error codes:', e);
    }
  }
  
  public saveErrorCodes(): void {
    const errorObj: Record<string, number> = {};
    this.errorMap.forEach((code, message) => {
      errorObj[message] = code;
    });
    
    fs.writeFileSync(
      this.filePath, 
      JSON.stringify(errorObj, null, 2),
      'utf8'
    );
  }
  
  public getErrorCode(message: string): number {
    if (!this.errorMap.has(message)) {
      const code = this.nextAvailableCode++;
      this.errorMap.set(message, code);
      this.reverseMap.set(code, message);
      this.saveErrorCodes();
    }
    
    return this.errorMap.get(message)!;
  }
  
  public getErrorMessage(code: number): string | undefined {
    return this.reverseMap.get(code);
  }
  
  // This is the pattern used by React
  public error(message: string): Error {
    if (process.env.NODE_ENV === 'production') {
      return ErrorProd(this.getErrorCode(message));
    } else {
      return ErrorDev(message);
    }
  }
}

// Repurposable areas or scenarios
// - Production error minification in any framework
// - Error tracking systems
// - Internationalization of error messages
// - Client-side error reporting with privacy controls
// - API error standardization
// - Error documentation generation
// - Error analytics and frequency tracking

// Code example: Implementing an error tracking system with minification
export function createErrorSystem(appName: string) {
  const errorSystem = new ErrorCodeSystem({
    filePath: `./src/${appName}-error-codes.json`,
    startFrom: 5000,
  });
  
  return {
    throw(message: string): never {
      throw errorSystem.error(message);
    },
    
    createError(message: string): Error {
      return errorSystem.error(message);
    },
    
    // For displaying full error messages in an error overlay/docs
    getFullErrorFromCode(code: number): string | undefined {
      return errorSystem.getErrorMessage(code);
    }
  };
}
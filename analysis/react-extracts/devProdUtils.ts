/**
 * Conditional Export Pattern for Development/Production
 * 
 * Extracted from React's pattern of conditionally exporting 
 * functionality based on environment.
 */

const IS_DEV = process.env.NODE_ENV !== 'production';

// Simpler logger for production
const simpleLogger = {
  log: (message: string) => console.log(message),
  error: (error: Error | string) => console.error(error),
  warn: (warning: string) => console.warn(warning),
  info: (message: string) => console.info(message),
};

// Detailed logger with timestamps and levels
const detailedLogger = {
  log: (message: string) => console.log(`[LOG ${new Date().toISOString()}]`, message),
  error: (error: Error | string) => {
    console.error(`[ERROR ${new Date().toISOString()}]`, error);
    console.trace('Stack trace:');
  },
  warn: (warning: string) => console.warn(`[WARN ${new Date().toISOString()}]`, warning),
  info: (message: string) => console.info(`[INFO ${new Date().toISOString()}]`, message),
};

// Development-only utilities
interface DevTools {
  measureRender: <T>(componentName: string, fn: () => T) => T;
  trackMemory: () => void;
}

// Always export the main logger
export const logger = IS_DEV ? detailedLogger : simpleLogger;

// Development-only exports
export const dev: {
  DevTools?: DevTools;
  perfMetrics?: Record<string, any>;
  helpers?: Record<string, any>;
} = {};

if (IS_DEV) {
  dev.DevTools = {
    measureRender: <T>(componentName: string, fn: () => T): T => {
      console.time(`⚡ ${componentName}`);
      const result = fn();
      console.timeEnd(`⚡ ${componentName}`);
      return result;
    },
    trackMemory: () => {
      console.log('Memory usage:', process.memoryUsage());
    }
  };
  
  dev.helpers = {
    validateProps: (props: Record<string, any>) => {
      // Development validation code
      return true;
    },
    traceRendering: (component: string) => {
      console.log(`Rendering ${component}`);
    }
  };
}
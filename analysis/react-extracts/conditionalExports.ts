/**
 * Conditional Export Pattern for Development/Production
 * 
 * How React conditionally exports different implementations based on environment
 */

// Actual code pattern from React (simplified from React JSX Runtime)
const IS_DEV = process.env.NODE_ENV !== 'production';

// Example from React's JSX Runtime
const jsx: any = IS_DEV
  ? function jsxWithValidation(type, props, key) {
      // Development version with extra validation
      checkJSXProps(type, props);
      return jsxDEV(type, props, key);
    }
  : function jsxProd(type, props, key) {
      // Production version - minimal and fast
      return {
        $$typeof: REACT_ELEMENT_TYPE,
        type,
        key: key === undefined ? null : key,
        props
      };
    };

// Another example of conditional exports pattern from React
let warnAboutUpdateInRender: ((fiber: any) => void) | null = null;

if (IS_DEV) {
  warnAboutUpdateInRender = fiber => {
    console.error(
      'Cannot update during an existing state transition (such as within ' +
      '`render`). Render methods should be a pure function of props and state.'
    );
  };
}

export { jsx, warnAboutUpdateInRender };

// Repurposable areas or scenarios
// - Development tools exclusion in production
// - Bundle size optimization
// - Feature flagging system
// - Environment-specific exports
// - Debugging utilities
// - Performance monitoring tools
// - Error handling with different behaviors
// - A/B testing framework

// Code example: Logger with environment-specific implementations
export interface Logger {
  log(message: string, ...data: any[]): void;
  error(message: string | Error, ...data: any[]): void;
  warn(message: string, ...data: any[]): void;
  info(message: string, ...data: any[]): void;
  debug(message: string, ...data: any[]): void;
}

const noopLogger: Logger = {
  log: () => {},
  error: () => {},
  warn: () => {},
  info: () => {},
  debug: () => {},
};

const consoleLogger: Logger = {
  log: (message, ...data) => console.log(`[LOG] ${message}`, ...data),
  error: (message, ...data) => console.error(`[ERROR] ${message}`, ...data),
  warn: (message, ...data) => console.warn(`[WARN] ${message}`, ...data),
  info: (message, ...data) => console.info(`[INFO] ${message}`, ...data),
  debug: (message, ...data) => console.debug(`[DEBUG] ${message}`, ...data),
};

const devLogger: Logger = {
  log: (message, ...data) => console.log(`[${new Date().toISOString()}][LOG] ${message}`, ...data),
  error: (message, ...data) => {
    console.error(`[${new Date().toISOString()}][ERROR] ${message}`, ...data);
    console.trace('Stack trace:'); // Only in dev we want stack traces
  },
  warn: (message, ...data) => console.warn(`[${new Date().toISOString()}][WARN] ${message}`, ...data),
  info: (message, ...data) => console.info(`[${new Date().toISOString()}][INFO] ${message}`, ...data),
  debug: (message, ...data) => console.debug(`[${new Date().toISOString()}][DEBUG] ${message}`, ...data),
};

export const logger: Logger = process.env.NODE_ENV === 'production' 
  ? (process.env.ENABLE_LOGS === 'true' ? consoleLogger : noopLogger)
  : devLogger;

// Development-only performance monitoring (not included in production builds)
export const performance = process.env.NODE_ENV !== 'production' 
  ? {
      mark: (name: string) => window.performance?.mark(name),
      measure: (name: string, startMark: string, endMark: string) => 
        window.performance?.measure(name, startMark, endMark),
      getEntriesByType: (type: string) => window.performance?.getEntriesByType(type) || [],
      clearMarks: () => window.performance?.clearMarks(),
      clearMeasures: () => window.performance?.clearMeasures(),
    }
  : undefined;
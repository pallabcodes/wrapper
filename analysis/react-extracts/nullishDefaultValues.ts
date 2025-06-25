/**
 * Nullish Default Values Pattern
 * 
 * React's pattern for providing default values intelligently
 */

// Actual code from React
function disableLogs(fn: () => any): any {
  // React's disableLogs function is a common pattern for temporarily
  // disabling console output during expected "error" conditions
  
  const prevConsoleError = console.error;
  try {
    console.error = () => {};
    return fn();
  } finally {
    console.error = prevConsoleError;
  }
}

// Another actual pattern from React
function getProperty(obj: any, prop: string): any {
  // React often uses this pattern to safely extract properties
  // without explicitly checking if obj is null/undefined
  if (obj == null) {
    return undefined;
  }
  return obj[prop];
}

// Null coalescing pattern from React's internals
export function getDisplayName(Component: any, fallback: string = 'Component'): string {
  return Component.displayName || Component.name || fallback;
}

// Repurposable areas or scenarios
// - API response handling with fallbacks
// - Configuration systems with defaults
// - Component props default values
// - Data normalization
// - Error handling with graceful fallbacks
// - Form validation with default states
// - CLI argument processing

// Code example: Configuration system with intelligent defaults
export interface Config {
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
    headers?: Record<string, string>;
  };
  ui: {
    theme: string;
    animations: boolean;
    density: 'compact' | 'comfortable' | 'spacious';
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enabled: boolean;
    destination?: string;
  };
}

export function createConfig(userConfig: Partial<Config> = {}): Config {
  // Default configurations
  const defaultConfig: Config = {
    api: {
      baseUrl: 'https://api.example.com',
      timeout: 5000,
      retries: 3,
      headers: {
        'Content-Type': 'application/json'
      }
    },
    ui: {
      theme: 'light',
      animations: true,
      density: 'comfortable'
    },
    logging: {
      level: 'info',
      enabled: true
    }
  };
  
  // Deep merge with intelligent defaults
  return {
    api: {
      baseUrl: userConfig.api?.baseUrl ?? defaultConfig.api.baseUrl,
      timeout: userConfig.api?.timeout ?? defaultConfig.api.timeout,
      retries: userConfig.api?.retries ?? defaultConfig.api.retries,
      headers: {
        ...defaultConfig.api.headers,
        ...userConfig.api?.headers
      }
    },
    ui: {
      theme: userConfig.ui?.theme ?? defaultConfig.ui.theme,
      animations: userConfig.ui?.animations ?? defaultConfig.ui.animations,
      density: userConfig.ui?.density ?? defaultConfig.ui.density
    },
    logging: {
      level: userConfig.logging?.level ?? defaultConfig.logging.level,
      enabled: userConfig.logging?.enabled ?? defaultConfig.logging.enabled,
      destination: userConfig.logging?.destination ?? defaultConfig.logging.destination
    }
  };
}
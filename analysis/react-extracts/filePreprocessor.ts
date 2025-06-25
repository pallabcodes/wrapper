/**
 * Clever Babel Preprocessor Configuration
 * 
 * Extracted from React's pattern of applying different transformations
 * based on file paths and environment.
 */

interface PreprocessorOptions {
  plugins?: any[];
  transformNodeModules?: boolean;
}

export function createFilePreprocessor(options: PreprocessorOptions = {}) {
  return function preprocessor(filePath: string, content: string) {
    // Different handling for different file types
    if (filePath.match(/\.tsx?$/)) {
      return processTypeScriptFile(filePath, content, options);
    }
    
    if (filePath.match(/\.jsx?$/)) {
      return processJavaScriptFile(filePath, content, options);
    }
    
    if (filePath.match(/\.json$/)) {
      return { code: content };  // Pass through JSON files
    }
    
    if (filePath.match(/\.css$/)) {
      return processCSSFile(filePath, content, options);
    }
    
    // Path-based transformations
    const plugins = [...(options.plugins || [])];
    
    // Apply special transformations to test files
    const isTestFile = filePath.includes('/__tests__/') || filePath.endsWith('.test.js');
    if (isTestFile) {
      plugins.push(require('./plugins/test-transform'));
    }
    
    // Apply special transformations for specific directories
    if (filePath.includes('/components/')) {
      plugins.push(require('./plugins/component-transform'));
    }
    
    // Skip transformations for third-party code
    if (filePath.includes('/node_modules/') && !options.transformNodeModules) {
      return { code: content };
    }
    
    return transformFile(filePath, content, { 
      ...options,
      plugins
    });
  };
}

// Helper functions (placeholders)
function processTypeScriptFile(filePath: string, content: string, options: any) {
  return { code: '/* TypeScript processing */' };
}

function processJavaScriptFile(filePath: string, content: string, options: any) {
  return { code: '/* JavaScript processing */' };
}

function processCSSFile(filePath: string, content: string, options: any) {
  return { code: '/* CSS processing */' };
}

function transformFile(filePath: string, content: string, options: any) {
  return { code: '/* Transformed file */' };
}
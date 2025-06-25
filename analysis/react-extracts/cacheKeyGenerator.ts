/**
 * Cache Key Function Generator for Preprocessors
 * 
 * React uses this pattern to generate deterministic cache keys based on
 * dependencies and inputs for its compilation/preprocessing tools.
 */

// Actual code from React's preprocessor.js
import * as crypto from 'crypto';
import * as fs from 'fs';

export function createCacheKeyFunction(
  dependencyPaths: string[] = [],
  environmentValues: string[] = []
): (fileContent: string, filePath: string, configStr: string) => string {
  // Read files once on startup and generate hashes for them
  const dependencyHashes = dependencyPaths.map(path => {
    try {
      const content = fs.readFileSync(path, 'utf8');
      return crypto.createHash('md5').update(content).digest('hex');
    } catch (e) {
      return `error-reading-${path}`;
    }
  });
  
  // Return a function that generates a cache key
  return function getCacheKey(
    fileContent: string, 
    filePath: string, 
    configStr: string
  ): string {
    const hash = crypto.createHash('md5')
      // Input file content
      .update(fileContent || '')
      // File path for cache uniqueness
      .update(filePath || '')
      // Configuration 
      .update(configStr || '')
      // Dependencies content hashes
      .update(dependencyHashes.join(':'))
      // Environment values
      .update(environmentValues.join(':'));
      
    return hash.digest('hex');
  };
}

// Repurposable areas or scenarios
// - Build systems with caching
// - Compiler toolchains
// - Template engines with caching
// - Asset processing pipelines
// - Server-side rendering
// - GraphQL/API response caching
// - Content hashing for cache busting
// - Database query caching

// Code example: Template caching system
export interface TemplateCache {
  get(key: string): string | undefined;
  set(key: string, value: string): void;
  invalidateForDependency(dependency: string): void;
}

export function createTemplateCompiler(options: {
  templateRoot: string;
  cacheSize?: number;
}) {
  const { templateRoot, cacheSize = 100 } = options;
  
  // Cache storage
  const cache = new Map<string, string>();
  // Track templates by their dependencies
  const dependencyMap = new Map<string, Set<string>>();
  
  // Generate deterministic cache key for a template
  const generateCacheKey = createCacheKeyFunction(
    [
      // Include compiler configuration files as dependencies
      `${process.cwd()}/template-config.json`,
      `${process.cwd()}/babel.config.js`,
    ],
    [
      `NODE_ENV=${process.env.NODE_ENV}`,
      `VERSION=${process.env.APP_VERSION || '1.0.0'}`,
    ]
  );
  
  // Helpers to track template dependencies
  function trackDependency(templatePath: string, dependency: string): void {
    if (!dependencyMap.has(dependency)) {
      dependencyMap.set(dependency, new Set());
    }
    dependencyMap.get(dependency)!.add(templatePath);
  }
  
  return {
    // Compile a template and cache the result
    compile(templatePath: string, context: Record<string, any>): string {
      const fullPath = `${templateRoot}/${templatePath}`;
      const contextStr = JSON.stringify(context);
      
      // Generate cache key based on template content, path and context
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const cacheKey = generateCacheKey(content, fullPath, contextStr);
        
        // Check cache first
        if (cache.has(cacheKey)) {
          return cache.get(cacheKey)!;
        }
        
        // Parse template for @include directives to track dependencies
        const dependencies = content.match(/@include\s+([^\s]+)/g) || [];
        
        // Track dependencies for this template
        dependencies.forEach(dep => {
          const depPath = dep.replace('@include', '').trim();
          trackDependency(templatePath, depPath);
        });
        
        // Compile template (simplified)
        const compiled = content.replace(
          /\{\{\s*([^}]+)\s*\}\}/g, 
          (_, expr) => String(eval(`with(context) { return ${expr}; }`))
        );
        
        // Manage cache size
        if (cache.size >= cacheSize) {
          const firstKey = cache.keys().next().value;
          cache.delete(firstKey);
        }
        
        // Store in cache
        cache.set(cacheKey, compiled);
        return compiled;
      } catch (err) {
        console.error(`Error compiling template ${templatePath}:`, err);
        return `Error: Failed to compile template ${templatePath}`;
      }
    },
    
    // Invalidate cache for a template and its dependents
    invalidate(templatePath: string): void {
      // Find all templates that depend on this one
      const affectedTemplates = new Set<string>([templatePath]);
      
      // Find all templates that include this one, directly or indirectly
      const findDependents = (path: string) => {
        dependencyMap.forEach((dependents, dependency) => {
          if (dependency === path && dependents.size > 0) {
            dependents.forEach(dep => {
              if (!affectedTemplates.has(dep)) {
                affectedTemplates.add(dep);
                findDependents(dep);
              }
            });
          }
        });
      };
      
      findDependents(templatePath);
      
      // Clear these templates from cache
      cache.clear(); // For simplicity, clear entire cache
    },
    
    // Get cache statistics
    getStats() {
      return {
        cacheSize: cache.size,
        dependencyMapSize: dependencyMap.size,
      };
    }
  };
}
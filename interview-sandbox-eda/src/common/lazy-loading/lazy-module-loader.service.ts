import { Injectable, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

/**
 * Lazy Module Loader Service
 * 
 * Demonstrates lazy loading modules and deferring module registration
 * 
 * Use cases:
 * - Load modules on-demand based on runtime conditions
 * - Reduce initial startup time
 * - Load plugins/extensions dynamically
 * - Conditional module loading based on configuration
 */
@Injectable()
export class LazyModuleLoaderService {
  private loadedModules = new Map<string, any>();

  constructor(private readonly moduleRef: ModuleRef) {}

  /**
   * Dynamically load a module based on condition
   */
  async loadModuleIfNeeded<T>(
    moduleClass: Type<T>,
    condition: () => boolean | Promise<boolean>,
  ): Promise<T | null> {
    const moduleName = moduleClass.name;

    // Check if already loaded
    if (this.loadedModules.has(moduleName)) {
      return this.loadedModules.get(moduleName);
    }

    // Check condition
    const shouldLoad = await condition();
    if (!shouldLoad) {
      return null;
    }

    try {
      // Dynamically import and register module
      const moduleInstance = await this.importAndRegisterModule(moduleClass);
      this.loadedModules.set(moduleName, moduleInstance);
      
      console.log(`Lazy loaded module: ${moduleName}`);
      return moduleInstance;
    } catch (error) {
      console.error(`Failed to load module ${moduleName}:`, error);
      throw error;
    }
  }

  /**
   * Load module based on feature flag
   */
  async loadModuleByFeatureFlag<T>(
    moduleClass: Type<T>,
    featureFlag: string,
  ): Promise<T | null> {
    return this.loadModuleIfNeeded(moduleClass, async () => {
      // Check feature flag from config or external service
      const isEnabled = process.env[`FEATURE_${featureFlag}`] === 'true';
      return isEnabled;
    });
  }

  /**
   * Load module when first requested (lazy initialization)
   */
  async getOrLoadModule<T>(moduleClass: Type<T>): Promise<T> {
    const moduleName = moduleClass.name;

    if (this.loadedModules.has(moduleName)) {
      return this.loadedModules.get(moduleName);
    }

    const moduleInstance = await this.importAndRegisterModule(moduleClass);
    this.loadedModules.set(moduleName, moduleInstance);
    return moduleInstance;
  }

  private async importAndRegisterModule<T>(moduleClass: Type<T>): Promise<T> {
    // In a real implementation, you would use NestJS's dynamic module loading
    // This is a simplified example
    return new moduleClass() as T;
  }

  /**
   * Unload a module (cleanup)
   */
  async unloadModule(moduleName: string): Promise<void> {
    if (this.loadedModules.has(moduleName)) {
      // Perform cleanup if needed
      this.loadedModules.delete(moduleName);
      console.log(`Unloaded module: ${moduleName}`);
    }
  }

  /**
   * Get list of loaded modules
   */
  getLoadedModules(): string[] {
    return Array.from(this.loadedModules.keys());
  }
}


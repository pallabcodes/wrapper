/**
 * NestJS Crypto Module
 * 
 * Module for integrating enhanced crypto functionality
 * into NestJS applications.
 */

// Simple module implementation without NestJS dependencies
// This will be properly implemented when NestJS is available

export interface CryptoModuleOptions {
  config?: any;
  enableAudit?: boolean;
  enablePerformanceMonitoring?: boolean;
}

export class CryptoModule {
  static forRoot(_options: CryptoModuleOptions = {}) {
    return {
      module: CryptoModule,
      providers: [],
      exports: [],
    };
  }
}
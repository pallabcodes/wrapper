/**
 * Symbol-based Token Identifiers for Dependency Injection
 * 
 * Using Symbols instead of strings prevents token collision and provides
 * better type safety. Symbols are unique and cannot be accidentally duplicated.
 */

// Token for Logger Service
export const LOGGER_TOKEN = Symbol('LOGGER_SERVICE');

// Token for Cache Service
export const CACHE_TOKEN = Symbol('CACHE_SERVICE');

// Token for Email Service
export const EMAIL_TOKEN = Symbol('EMAIL_SERVICE');

// Token for Payment Gateway
export const PAYMENT_GATEWAY_TOKEN = Symbol('PAYMENT_GATEWAY');

// Token for File Storage
export const FILE_STORAGE_TOKEN = Symbol('FILE_STORAGE');

// Token for External API Client
export const EXTERNAL_API_TOKEN = Symbol('EXTERNAL_API_CLIENT');


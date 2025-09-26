import { SetMetadata, applyDecorators, UseInterceptors, UseGuards } from '@nestjs/common';
import { MobileApiInterceptor } from '../interceptors/mobile-api.interceptor';
import { AuthContextInterceptor } from '../interceptors/auth-context.interceptor';
import { MobileCacheInterceptor } from '../interceptors/mobile-cache.interceptor';
import { MobileOptimizationInterceptor } from '../interceptors/mobile-optimization.interceptor';
import { MobileSecurityGuard } from '../guards/mobile-security.guard';
import { MobileDeviceInfo, MobileApiOptions, RbacRequirement } from '../interfaces/mobile-api.interface';
import { RbacGuard } from '../guards/rbac.guard';

export const MOBILE_API_METADATA = 'mobile_api_metadata';
export const MOBILE_CACHE_METADATA = 'mobile_cache_metadata';
export const MOBILE_OPTIMIZATION_METADATA = 'mobile_optimization_metadata';
export const MOBILE_SECURITY_METADATA = 'mobile_security_metadata';

// MobileApiOptions is now defined in interfaces/mobile-api.interface.ts

export interface MobileCacheOptions {
  key?: string;
  ttl?: number;
  tags?: string[];
  version?: string;
  strategy?: 'cache-first' | 'network-first' | 'cache-only' | 'network-only';
}

export interface MobileOptimizationOptions {
  enableCompression?: boolean;
  enableImageOptimization?: boolean;
  enableMinification?: boolean;
  enableLazyLoading?: boolean;
  maxImageSize?: number;
  imageFormats?: string[];
  quality?: number;
}

export interface MobileSecurityOptions {
  requireAuth?: boolean;
  requireBiometrics?: boolean;
  requireLocation?: boolean;
  allowedDevices?: string[];
  allowedPlatforms?: string[];
  maxConcurrentSessions?: number;
  sessionTimeout?: number;
}

/**
 * Decorator for mobile API endpoints with automatic optimization
 */
export function MobileApi(options: MobileApiOptions = {}) {
  return applyDecorators(
    SetMetadata(MOBILE_API_METADATA, options),
    UseInterceptors(AuthContextInterceptor, MobileApiInterceptor),
  );
}

/**
 * Decorator for mobile caching functionality
 */
export function MobileCache(options: MobileCacheOptions = {}) {
  return applyDecorators(
    SetMetadata(MOBILE_CACHE_METADATA, options),
    UseInterceptors(MobileCacheInterceptor),
  );
}

/**
 * Decorator for mobile optimization features
 */
export function MobileOptimization(options: MobileOptimizationOptions = {}) {
  return applyDecorators(
    SetMetadata(MOBILE_OPTIMIZATION_METADATA, options),
    UseInterceptors(MobileOptimizationInterceptor),
  );
}

/**
 * Decorator for mobile security features
 */
export function MobileSecurity(options: MobileSecurityOptions = {}) {
  return applyDecorators(
    SetMetadata(MOBILE_SECURITY_METADATA, options),
    UseInterceptors(MobileSecurityGuard),
  );
}

/**
 * Combined decorator for full mobile API functionality
 */
export function MobileEndpoint(
  apiOptions: MobileApiOptions = {},
  cacheOptions: MobileCacheOptions = {},
  optimizationOptions: MobileOptimizationOptions = {},
  securityOptions: MobileSecurityOptions = {},
) {
  return applyDecorators(
    MobileApi(apiOptions),
    MobileCache(cacheOptions),
    MobileOptimization(optimizationOptions),
    MobileSecurity(securityOptions),
  );
}

/**
 * Preset: Read-heavy endpoint with caching and light optimization
 */
export function MobileReadHeavy(options: { cacheKey?: string; ttl?: number } = {}) {
  const { cacheKey = 'read:heavy', ttl = 60 } = options;
  return applyDecorators(
    MobileApi({ compress: true, cacheKey, cacheTtl: ttl }),
    MobileCache({ key: cacheKey, ttl, strategy: 'cache-first' }),
    MobileOptimization({ enableImageOptimization: true, quality: 80 })
  );
}

/**
 * Preset: Secure read-heavy endpoint (auth + caching + optimization)
 */
export function MobileSecureReadHeavy(options: {
  cacheKey?: string;
  ttl?: number;
  allowedPlatforms?: string[];
  sessionTimeout?: number;
} = {}) {
  const { cacheKey = 'secure:read:heavy', ttl = 60, allowedPlatforms = ['ios','android','web'], sessionTimeout = 30000 } = options;
  return applyDecorators(
    MobileReadHeavy({ cacheKey, ttl }),
    MobileSecurity({ requireAuth: true, allowedPlatforms, sessionTimeout })
  );
}

// RBAC decorators
export const RBAC_METADATA_KEY = 'mobile:rbac';

export function RequireRoles(...roles: string[]) {
  const requirement: RbacRequirement = { anyRole: roles };
  return applyDecorators(SetMetadata(RBAC_METADATA_KEY, requirement), UseGuards(RbacGuard));
}

export function RequireAllRoles(...roles: string[]) {
  const requirement: RbacRequirement = { allRoles: roles };
  return applyDecorators(SetMetadata(RBAC_METADATA_KEY, requirement), UseGuards(RbacGuard));
}

export function RequirePermissions(...permissions: string[]) {
  const requirement: RbacRequirement = { anyPermission: permissions };
  return applyDecorators(SetMetadata(RBAC_METADATA_KEY, requirement), UseGuards(RbacGuard));
}

export function RequireAllPermissions(...permissions: string[]) {
  const requirement: RbacRequirement = { allPermissions: permissions };
  return applyDecorators(SetMetadata(RBAC_METADATA_KEY, requirement), UseGuards(RbacGuard));
}

export function RequireOwner(resourceParam: string = 'userId') {
  const requirement: RbacRequirement = { allowIfOwner: true, resourceParam };
  return applyDecorators(SetMetadata(RBAC_METADATA_KEY, requirement), UseGuards(RbacGuard));
}

/**
 * Decorator for offline-capable endpoints
 */
export function OfflineCapable(options: { syncOnReconnect?: boolean; maxRetries?: number } = {}) {
  return SetMetadata('offline_capable', {
    syncOnReconnect: true,
    maxRetries: 3,
    ...options,
  });
}

/**
 * Decorator for push notification endpoints
 */
export function PushNotification(options: { priority?: 'high' | 'normal' | 'low' } = {}) {
  return SetMetadata('push_notification', {
    priority: 'normal',
    ...options,
  });
}

/**
 * Decorator for biometric authentication
 */
export function BiometricAuth(options: { fallbackToPassword?: boolean } = {}) {
  return SetMetadata('biometric_auth', {
    fallbackToPassword: true,
    ...options,
  });
}

/**
 * Decorator for location-based features
 */
export function LocationRequired(options: { accuracy?: 'high' | 'medium' | 'low' } = {}) {
  return SetMetadata('location_required', {
    accuracy: 'medium',
    ...options,
  });
}

/**
 * Decorator for device-specific optimizations
 */
export function DeviceOptimized(options: { 
  platforms?: string[];
  minVersion?: string;
  maxVersion?: string;
} = {}) {
  return SetMetadata('device_optimized', {
    platforms: ['ios', 'android'],
    ...options,
  });
}

/**
 * Decorator for rate limiting
 */
export function RateLimit(options: { 
  windowMs: number; 
  max: number; 
  message?: string;
  skipSuccessfulRequests?: boolean;
} = { windowMs: 60000, max: 100 }) {
  return SetMetadata('rate_limit', {
    message: 'Too many requests',
    skipSuccessfulRequests: false,
    ...options,
  });
}

/**
 * Decorator for file upload validation
 */
export function FileUpload(options: {
  maxSize?: number;
  allowedTypes?: string[];
  multiple?: boolean;
  required?: boolean;
} = {}) {
  return SetMetadata('file_upload', {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    multiple: false,
    required: false,
    ...options,
  });
}

/**
 * Decorator for analytics tracking
 */
export function TrackEvent(eventName: string, properties?: Record<string, any>) {
  return SetMetadata('track_event', {
    eventName,
    properties: properties || {},
  });
}

/**
 * Decorator for A/B testing
 */
export function ABTest(testName: string, variants: string[]) {
  return SetMetadata('ab_test', {
    testName,
    variants,
  });
}

/**
 * Decorator for feature flags
 */
export function FeatureFlag(flagName: string, defaultValue: boolean = false) {
  return SetMetadata('feature_flag', {
    flagName,
    defaultValue,
  });
}

/**
 * Decorator for deep linking
 */
export function DeepLink(options: { 
  scheme?: string; 
  host?: string; 
  path?: string;
} = {}) {
  return SetMetadata('deep_link', {
    scheme: 'ecommerce',
    host: 'app',
    path: '/',
    ...options,
  });
}

/**
 * Decorator for background sync
 */
export function BackgroundSync(options: { 
  priority?: 'high' | 'normal' | 'low';
  retryCount?: number;
} = {}) {
  return SetMetadata('background_sync', {
    priority: 'normal',
    retryCount: 3,
    ...options,
  });
}

/**
 * Decorator for progressive web app features
 */
export function PWA(options: { 
  installable?: boolean;
  offline?: boolean;
  backgroundSync?: boolean;
} = {}) {
  return SetMetadata('pwa', {
    installable: true,
    offline: true,
    backgroundSync: true,
    ...options,
  });
}

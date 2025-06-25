/**
 * Environment Feature Flags System
 * 
 * Extracted from React's pattern for conditionally enabling features
 * based on environment, build configuration, or runtime capabilities.
 */

// Actual code from React (from packages/shared/forks/ReactFeatureFlags.*.js)
export const enableProfilerTimer = __PROFILE__;
export const enableProfilerCommitHooks = __PROFILE__;
export const enableAsyncDebugInfo = false;
export const enableSchedulingProfiler = false;
export const enableProfilerNestedUpdatePhase = __PROFILE__;
export const enableLegacyCache = __EXPERIMENTAL__;
export const enableTaint = true;
export const enablePostpone = false;
export const enableHalt = false;
export const disableCommentsAsDOMContainers = true;
export const disableInputAttributeSyncing = false;
export const enableScopeAPI = false;
export const enableCreateEventHandleAPI = false;
export const enableComponentPerformanceTrack = false;
export const disableSchedulerTimeoutInWorkLoop = false;
export const disableModulePatternComponents = false;
export const enableAsyncIterableChildren = false;

// Repurposable areas or scenarios
// - Feature toggles in large applications
// - A/B testing frameworks
// - Platform-specific code paths
// - Environment-specific configurations
// - Gradual feature rollouts
// - Runtime performance optimizations
// - Experimental feature management
// - Backwards compatibility management

// Code example: Application feature flag system
export type FeatureFlags = {
  readonly [key: string]: boolean;
};

const BASE_FLAGS: FeatureFlags = {
  enableNewNavigation: false,
  enableNewCheckoutFlow: false,
  enablePerformanceMetrics: false,
  disableLegacyAPIs: false,
  enableExperimentalFeatures: false,
  disableLogger: false,
};

function createFeatureFlags(env: string): FeatureFlags {
  const envOverrides: Partial<FeatureFlags> = {
    production: {
      enablePerformanceMetrics: true,
      disableLegacyAPIs: true,
      disableLogger: true,
    },
    staging: {
      enableNewNavigation: true,
      enableNewCheckoutFlow: true,
      enablePerformanceMetrics: true,
    },
    development: {
      enableExperimentalFeatures: true,
      enablePerformanceMetrics: true,
    },
    test: {
      disableLogger: true,
    },
  }[env] || {};

  // Merge with base flags
  return Object.freeze({
    ...BASE_FLAGS,
    ...envOverrides,
    // Allow runtime overrides from localStorage in non-production
    ...(env !== 'production' ? loadLocalOverrides() : {}),
  });
}

function loadLocalOverrides(): Partial<FeatureFlags> {
  if (typeof localStorage === 'undefined') {
    return {};
  }
  
  try {
    const value = localStorage.getItem('feature-flags');
    return value ? JSON.parse(value) : {};
  } catch (e) {
    console.error('Failed to parse feature flags from localStorage', e);
    return {};
  }
}

export const Features = createFeatureFlags(process.env.NODE_ENV || 'development');
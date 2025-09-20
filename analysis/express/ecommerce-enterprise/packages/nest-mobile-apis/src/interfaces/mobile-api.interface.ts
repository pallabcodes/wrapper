export interface MobileDeviceInfo {
  platform: 'ios' | 'android' | 'web' | 'unknown';
  version: string;
  model?: string;
  manufacturer?: string;
  screenSize: {
    width: number;
    height: number;
    density: number;
  };
  capabilities: {
    camera: boolean;
    gps: boolean;
    pushNotifications: boolean;
    biometrics: boolean;
    nfc: boolean;
  };
  networkType: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  connectionSpeed: 'slow' | 'medium' | 'fast' | 'unknown';
  appVersion?: string;
  language?: string;
  timezone?: string;
  userAgent?: string;
}

export interface MobileApiConfig {
  enableCompression: boolean;
  enableImageOptimization: boolean;
  enableCaching: boolean;
  enableOfflineSupport: boolean;
  enablePushNotifications: boolean;
  enableBiometrics: boolean;
  enableLocationServices: boolean;
  maxImageSize: number;
  maxFileSize: number;
  cacheTimeout: number;
  compressionLevel: number;
  imageFormats: string[];
  supportedResolutions: {
    width: number;
    height: number;
    quality: number;
  }[];
}

export interface MobileApiOptions {
  enableCompression?: boolean;
  enableCaching?: boolean;
  enableOptimization?: boolean;
  enableOfflineSupport?: boolean;
  cacheKey?: string;
  cacheTtl?: number;
  compress?: boolean;
  optimizeImages?: boolean;
  requireAuth?: boolean;
  requireBiometrics?: boolean;
  requireLocation?: boolean;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  rateLimit?: {
    windowMs: number;
    max: number;
  };
}

export interface MobileApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    timestamp: string;
    requestId: string;
    version: string;
    deviceInfo?: MobileDeviceInfo;
    performance: {
      responseTime: number;
      memoryUsage: number;
      cacheHit: boolean;
    };
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface MobileApiRequest {
  deviceInfo: MobileDeviceInfo;
  headers: Record<string, any>;
  query: Record<string, any>;
  body: Record<string, any>;
}

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  progressive?: boolean;
  grayscale?: boolean;
  blur?: number;
  sharpen?: number;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface CacheOptions {
  ttl: number;
  key: string;
  tags?: string[];
  priority?: 'low' | 'normal' | 'high';
  compress?: boolean;
}

export interface OfflineData {
  id: string;
  type: string;
  data: any;
  lastModified: string;
  version: number;
  syncStatus: 'pending' | 'synced' | 'conflict';
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
  imageUrl?: string;
  actionButtons?: {
    id: string;
    title: string;
    action: string;
  }[];
  category?: string;
  threadId?: string;
}

export interface MobileAnalytics {
  sessionId: string;
  userId?: string;
  deviceId: string;
  events: {
    name: string;
    timestamp: string;
    properties: Record<string, any>;
  }[];
  performance: {
    pageLoadTime: number;
    apiResponseTime: number;
    memoryUsage: number;
    batteryLevel?: number;
    networkLatency: number;
  };
  errors: {
    message: string;
    stack?: string;
    timestamp: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }[];
}

export interface MobileSecurityConfig {
  enableBiometrics: boolean;
  enablePinCode: boolean;
  enableFaceId: boolean;
  enableTouchId: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  enableJailbreakDetection: boolean;
  enableRootDetection: boolean;
  enableSslPinning: boolean;
  allowedOrigins: string[];
  encryptionKey: string;
}

export interface MobilePerformanceMetrics {
  apiCalls: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
    slowestEndpoint: string;
    fastestEndpoint: string;
  };
  cache: {
    hitRate: number;
    missRate: number;
    evictions: number;
    memoryUsage: number;
  };
  images: {
    totalProcessed: number;
    totalSize: number;
    averageSize: number;
    compressionRatio: number;
  };
  network: {
    totalRequests: number;
    totalBytes: number;
    averageLatency: number;
    slowestRequest: string;
  };
}

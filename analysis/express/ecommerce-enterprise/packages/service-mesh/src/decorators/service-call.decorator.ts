import { SetMetadata } from '@nestjs/common';

export interface ServiceCallOptions {
  serviceName: string;
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  timeout?: number;
  retries?: number;
  circuitBreaker?: boolean;
  loadBalancer?: {
    algorithm?: 'round-robin' | 'least-connections' | 'weighted' | 'ip-hash' | 'random';
    clientIp?: string;
  };
  headers?: Record<string, string>;
  auth?: {
    enabled: boolean;
    token?: string;
  };
  fallback?: string; // Method name for fallback
}

export const SERVICE_CALL_KEY = 'service:call';
export const SERVICE_CALL_OPTIONS = 'service:call:options';

export function ServiceCall(options: ServiceCallOptions) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      // Try to get serviceMeshService from the instance
      const serviceMeshService = (this as any).serviceMeshService;
      if (!serviceMeshService) {
        return originalMethod.apply(this, args);
      }

      try {
        // Build request options
        const requestOptions = {
          serviceName: options.serviceName,
          endpoint: options.endpoint,
          method: options.method || 'GET',
          timeout: options.timeout || 5000,
          retries: options.retries || 3,
          circuitBreaker: options.circuitBreaker !== false,
          loadBalancer: options.loadBalancer,
          headers: options.headers || {},
          auth: options.auth,
        };

        // Execute service call
        const result = await serviceMeshService.callService(requestOptions, args);
        return result;
      } catch (error) {
        // Try fallback if available
        if (options.fallback && typeof (this as any)[options.fallback] === 'function') {
          (this as any).logger?.warn(`Service call failed, using fallback: ${error instanceof Error ? error.message : String(error)}`);
          return (this as any)[options.fallback](...args);
        }
        
        throw error;
      }
    };

    SetMetadata(SERVICE_CALL_KEY, options.serviceName)(target, propertyKey, descriptor);
    SetMetadata(SERVICE_CALL_OPTIONS, options)(target, propertyKey, descriptor);
  };
}

export function ServiceName(serviceName: string) {
  return SetMetadata(SERVICE_CALL_KEY, serviceName);
}

export function ServiceEndpoint(endpoint: string) {
  return SetMetadata('service:endpoint', endpoint);
}

export function ServiceTimeout(timeout: number) {
  return SetMetadata('service:timeout', timeout);
}

export function ServiceRetries(retries: number) {
  return SetMetadata('service:retries', retries);
}

export function ServiceFallback(fallback: string) {
  return SetMetadata('service:fallback', fallback);
}

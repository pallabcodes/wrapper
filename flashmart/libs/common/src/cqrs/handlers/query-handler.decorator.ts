import { Injectable } from '@nestjs/common';
import { QueryBus } from '../query-bus';

export const QUERY_HANDLER_METADATA = '__queryHandler__';

export function QueryHandler(query: any) {
  return function (target: any) {
    Injectable()(target);

    // Store metadata for later registration
    Reflect.defineMetadata(QUERY_HANDLER_METADATA, query, target);

    // Override the constructor to register with query bus
    const originalConstructor = target.prototype.constructor;
    target.prototype.constructor = function (...args: any[]) {
      const instance = originalConstructor.apply(this, args);

      // Register with query bus if available
      if (args.length > 0) {
        const queryBus = args.find(arg => arg instanceof QueryBus);
        if (queryBus) {
          queryBus.registerHandler(query, instance);
        }
      }

      return instance;
    };

    return target;
  };
}

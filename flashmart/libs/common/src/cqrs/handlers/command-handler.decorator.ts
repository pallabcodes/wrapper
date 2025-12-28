import { Injectable } from '@nestjs/common';
import { CommandBus } from '../command-bus';

export const COMMAND_HANDLER_METADATA = '__commandHandler__';

export function CommandHandler(command: any) {
  return function (target: any) {
    Injectable()(target);

    // Store metadata for later registration
    Reflect.defineMetadata(COMMAND_HANDLER_METADATA, command, target);

    // Override the constructor to register with command bus
    const originalConstructor = target.prototype.constructor;
    target.prototype.constructor = function (...args: any[]) {
      const instance = originalConstructor.apply(this, args);

      // Register with command bus if available
      if (args.length > 0) {
        const commandBus = args.find(arg => arg instanceof CommandBus);
        if (commandBus) {
          commandBus.registerHandler(command, instance);
        }
      }

      return instance;
    };

    return target;
  };
}

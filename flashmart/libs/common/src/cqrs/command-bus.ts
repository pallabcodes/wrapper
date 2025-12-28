import { Injectable, Logger, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Command } from './command';
import { ICommandHandler } from './handlers/command-handler.interface';

@Injectable()
export class CommandBus {
  private readonly logger = new Logger('CommandBus');
  private handlers = new Map<string, ICommandHandler<Command>>();

  constructor(private readonly moduleRef: ModuleRef) {}

  async execute<T extends Command, R = any>(command: T): Promise<R> {
    const handler = this.handlers.get(command.constructor.name);

    if (!handler) {
      throw new Error(`No handler found for command: ${command.constructor.name}`);
    }

    this.logger.debug(`Executing command: ${command.constructor.name}`, {
      correlationId: command.correlationId,
      userId: command.userId,
    });

    try {
      const result = await handler.execute(command);
      this.logger.debug(`Command executed successfully: ${command.constructor.name}`);
      return result;
    } catch (error) {
      this.logger.error(`Command execution failed: ${command.constructor.name}`, {
        error: error.message,
        correlationId: command.correlationId,
        userId: command.userId,
      });
      throw error;
    }
  }

  registerHandler<T extends Command>(
    commandType: Type<T>,
    handler: ICommandHandler<T>,
  ): void {
    this.handlers.set(commandType.name, handler as ICommandHandler<Command>);
    this.logger.log(`Registered command handler: ${commandType.name}`);
  }

  getHandlers(): string[] {
    return Array.from(this.handlers.keys());
  }
}

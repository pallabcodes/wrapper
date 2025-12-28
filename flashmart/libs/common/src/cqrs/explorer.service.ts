import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryModule, DiscoveryService } from '@nestjs/core';
import { CommandBus } from './command-bus';
import { QueryBus } from './query-bus';
import { COMMAND_HANDLER_METADATA, QUERY_HANDLER_METADATA } from './handlers';

@Injectable()
export class ExplorerService implements OnModuleInit {
  private readonly logger = new Logger('ExplorerService');

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async onModuleInit() {
    await this.exploreAndRegisterHandlers();
  }

  private async exploreAndRegisterHandlers() {
    const controllers = this.discoveryService.getControllers();
    const providers = this.discoveryService.getProviders();
    const instances = [...controllers, ...providers];

    for (const wrapper of instances) {
      if (!wrapper.instance || !wrapper.metatype) {
        continue;
      }

      const instance = wrapper.instance;

      // Check for command handlers
      const commandType = Reflect.getMetadata(COMMAND_HANDLER_METADATA, instance.constructor);
      if (commandType) {
        this.commandBus.registerHandler(commandType, instance);
        this.logger.log(`Auto-registered command handler: ${commandType.name}`);
      }

      // Check for query handlers
      const queryType = Reflect.getMetadata(QUERY_HANDLER_METADATA, instance.constructor);
      if (queryType) {
        this.queryBus.registerHandler(queryType, instance);
        this.logger.log(`Auto-registered query handler: ${queryType.name}`);
      }
    }

    this.logger.log(`CQRS handlers exploration complete. Commands: ${this.commandBus.getHandlers().length}, Queries: ${this.queryBus.getHandlers().length}`);
  }
}

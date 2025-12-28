import { Module, DynamicModule, Global } from '@nestjs/common';
import { CommandBus } from './command-bus';
import { QueryBus } from './query-bus';
import { ExplorerService } from './explorer.service';

@Global()
@Module({})
export class CqrsModule {
  static forRoot(): DynamicModule {
    return {
      module: CqrsModule,
      providers: [
        CommandBus,
        QueryBus,
        ExplorerService,
      ],
      exports: [
        CommandBus,
        QueryBus,
      ],
      global: true,
    };
  }

  static forFeature(): DynamicModule {
    return {
      module: CqrsModule,
      providers: [
        ExplorerService,
      ],
      exports: [],
    };
  }
}

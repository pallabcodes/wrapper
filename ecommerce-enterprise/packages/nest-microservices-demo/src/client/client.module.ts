import { DynamicModule, Module } from '@nestjs/common';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';

export interface DemoClientOptions {
  host?: string;
  port?: number;
}

export const DEMO_CLIENT = Symbol('DEMO_CLIENT');

@Module({})
export class DemoClientModule {
  static register(options: DemoClientOptions = {}): DynamicModule {
    const host = options.host ?? '127.0.0.1';
    const port = options.port ?? 4010;

    const clientProvider = {
      provide: DEMO_CLIENT,
      useFactory: () =>
        ClientProxyFactory.create({
          transport: Transport.TCP,
          options: { host, port },
        }),
    };

    return {
      module: DemoClientModule,
      providers: [clientProvider],
      exports: [clientProvider],
    };
  }
}

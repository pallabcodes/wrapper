import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';

export function createNatsClient(servers: string[] = ['nats://localhost:4222']): ClientProxy {
  return ClientProxyFactory.create({ transport: Transport.NATS, options: { servers } });
}

export function withNatsHeaders<T>(payload: T, headers: Record<string, string>) {
  return { payload, headers } as { payload: T; headers: Record<string, string> };
}

import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';

export function createRmqClient(url = 'amqp://guest:guest@localhost:5672', queue = 'demo_queue'): ClientProxy {
  return ClientProxyFactory.create({
    transport: Transport.RMQ,
    options: { urls: [url], queue, queueOptions: { durable: false } },
  });
}

export function withRmqHeaders<T>(payload: T, headers: Record<string, string>) {
  return { payload, headers } as { payload: T; headers: Record<string, string> };
}

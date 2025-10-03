import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';

export function createKafkaClient(brokers: string[] = ['localhost:9092'], clientId = 'demo-client', groupId = 'demo-group'): ClientProxy {
  return ClientProxyFactory.create({
    transport: Transport.KAFKA,
    options: {
      client: { clientId, brokers },
      consumer: { groupId },
    },
  });
}

export function withKafkaHeaders<T>(payload: T, headers: Record<string, string>) {
  return { payload, headers } as { payload: T; headers: Record<string, string> };
}

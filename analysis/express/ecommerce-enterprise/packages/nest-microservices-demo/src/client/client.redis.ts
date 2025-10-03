import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';

export function createRedisClient(url = 'redis://localhost:6379'): ClientProxy {
  return ClientProxyFactory.create({ 
    transport: Transport.REDIS, 
    options: { 
      host: 'localhost',
      port: 6379
    } 
  });
}

export function withRedisHeaders<T>(payload: T, headers: Record<string, string>) {
  return { payload, headers } as { payload: T; headers: Record<string, string> };
}

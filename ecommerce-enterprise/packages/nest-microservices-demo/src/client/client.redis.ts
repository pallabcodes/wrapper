import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';

export function createRedisClient(url = 'redis://localhost:6379'): ClientProxy {
  const parsed = new URL(url);
  const port = parsed.port ? Number(parsed.port) : 6379;
  const host = parsed.hostname || 'localhost';

  return ClientProxyFactory.create({
    transport: Transport.REDIS,
    options: {
      host,
      port,
    },
  });
}

export function withRedisHeaders<T>(payload: T, headers: Record<string, string>) {
  return { payload, headers } as { payload: T; headers: Record<string, string> };
}

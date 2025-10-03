import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';

export function createMqttClient(url = 'mqtt://localhost:1883'): ClientProxy {
  return ClientProxyFactory.create({
    transport: Transport.MQTT,
    options: { url },
  });
}

export function withMqttHeaders<T>(payload: T, headers: Record<string, string>) {
  return { payload, headers } as { payload: T; headers: Record<string, string> };
}

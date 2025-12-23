# @ecommerce-enterprise/nest-microservices-demo

Advanced usage of `@nestjs/microservices` with TCP, Redis, NATS, RMQ, Kafka, MQTT, and gRPC; correlation serializer; interceptors; streaming; typed client; and hybrid HTTP + microservices.

## Correlation

- Client helper `withCorrelation(payload, id?)` adds `x-correlation-id` header.
- Redis server uses custom serializer and deserializer to propagate headers.
- For other transports, send `{ payload, headers }` envelopes via helpers:
  - `withNatsHeaders`, `withKafkaHeaders`, `withRmqHeaders`, `withMqttHeaders`, `withRedisHeaders`.
- Server handlers accept either raw payloads or the envelope. A small unwrapping helper normalizes input.

## gRPC client

```ts
import { createGrpcClient } from './src/client/client.grpc';

const grpc = createGrpcClient();
const sum = await grpc.Sum({ a: 2, b: 3 });
```

## Run servers

```bash
pnpm --filter @ecommerce-enterprise/nest-microservices-demo build
node dist/main.js
node dist/main.redis.js
node dist/main.nats.js
node dist/main.rmq.js
node dist/main.kafka.js
node dist/main.mqtt.js
node dist/main.grpc.js
node dist/main.hybrid.js
```

## Patterns

- sum: request-response
- batch-process: bulk request-response
- stream:ticks: streaming `Observable`
- user.created: `EventPattern`
- echo:context: returns pattern info from context

## Clients

- TCP module client: `DemoClientModule`, `DemoClient`
- Redis factory: `createRedisClient`
- NATS factory: `createNatsClient`
- RMQ factory: `createRmqClient`
- Kafka factory: `createKafkaClient`
- MQTT factory: `createMqttClient`

## gRPC proto

`src/proto/demo.proto` defines `Demo` service with `Sum` and `BatchProcess`.

## Interceptors

`ms.interceptors.ts` provides `TimeoutInterceptor` and `RetryInterceptor`.

## Smoke

```bash
pnpm --filter @ecommerce-enterprise/nest-microservices-demo smoke
```

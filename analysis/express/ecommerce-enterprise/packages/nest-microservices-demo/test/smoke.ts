import { lastValueFrom } from 'rxjs';
import { DemoClient } from '../src/client/demo.client';
import { createRedisClient } from '../src/client/client.redis';
import { createNatsClient } from '../src/client/client.nats';
import { createRmqClient } from '../src/client/client.rmq';
import { createKafkaClient } from '../src/client/client.kafka';
import { createMqttClient } from '../src/client/client.mqtt';

async function run() {
  const tcp = new DemoClient();
  const redis = createRedisClient();
  const nats = createNatsClient();
  const rmq = createRmqClient();
  const kafka = createKafkaClient();
  const mqtt = createMqttClient();

  const transports = [
    { name: 'tcp', client: tcp.client },
    { name: 'redis', client: redis },
    { name: 'nats', client: nats },
    { name: 'rmq', client: rmq },
    { name: 'kafka', client: kafka },
    { name: 'mqtt', client: mqtt },
  ];

  for (const t of transports) {
    t.client.connect && (await t.client.connect());
    const sum = await lastValueFrom(t.client.send('sum', { a: 2, b: 3 }));
    if (sum !== 5) throw new Error(`sum failed on ${t.name}`);
    const batch = await lastValueFrom(
      t.client.send('batch-process', [
        { id: 'a', value: 1 },
        { id: 'b', value: 2 },
      ])
    );
    if (batch !== 2) throw new Error(`batch failed on ${t.name}`);
    // event fire and forget
    t.client.emit('user.created', { id: 'u1' });
    if (t.client !== tcp.client) await t.client.close();
  }

  await tcp.close();
  // eslint-disable-next-line no-console
  console.log('smoke ok');
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

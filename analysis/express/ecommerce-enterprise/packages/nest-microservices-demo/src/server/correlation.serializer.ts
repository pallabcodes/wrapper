import { Serializer, Deserializer } from '@nestjs/microservices';

type Correlated<T> = T & { headers?: Record<string, string> };

export class CorrelationSerializer implements Serializer<Correlated<unknown>, Correlated<unknown>> {
  serialize(value: Correlated<unknown>): Correlated<unknown> {
    const headers = { ...(value.headers ?? {}), 'x-correlation-id': value.headers?.['x-correlation-id'] ?? generateCorrelationId() };
    return { ...value, headers };
  }
}

export class CorrelationDeserializer implements Deserializer<Correlated<unknown>, Correlated<unknown>> {
  deserialize(value: Correlated<unknown>, options?: Record<string, unknown>): Correlated<unknown> {
    const optionHeaders = (options?.['headers'] as Record<string, string> | undefined) ?? {};
    return { ...value, headers: { ...(value.headers ?? {}), ...optionHeaders } };
  }
}

function generateCorrelationId(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

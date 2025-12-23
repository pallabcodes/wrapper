export type Envelope<T> = { headers?: Record<string, string>; payload: T };

export function withCorrelation<T>(payload: T, correlationId?: string): Envelope<T> {
  const id = correlationId ?? generateCorrelationId();
  return { payload, headers: { 'x-correlation-id': id } };
}

export function getCorrelation(headers?: Record<string, string>): string | undefined {
  return headers?.['x-correlation-id'];
}

function generateCorrelationId(): string {
  const bytes = new Uint8Array(16);
  for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

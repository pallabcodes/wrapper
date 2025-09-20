import { BatchingService } from './batching.module';

describe('BatchingService', () => {
  it('batches duplicate loads in same microtask', async () => {
    let calls = 0;
    const svc = new BatchingService();
    const loader = svc.createLoader<string, number>(async (keys) => {
      calls++;
      const map: Record<string, number> = {};
      keys.forEach((k) => (map[k] = (k as any).length));
      return keys.map((k) => map[k as string]);
    });

    const p1 = loader.load('abc');
    const p2 = loader.load('abc');
    const p3 = loader.load('xy');
    const [v1, v2, v3] = await Promise.all([p1, p2, p3]);
    expect(v1).toBe(3);
    expect(v2).toBe(3);
    expect(v3).toBe(2);
    expect(calls).toBe(1);
  });
});



import { Global, Module, Scope } from '@nestjs/common';

type BatchFn<K, V> = (keys: readonly K[]) => Promise<readonly (V | Error)[]>;

class SimpleDataLoader<K, V> {
  private queue: { key: K; resolve: (v: V) => void; reject: (e: any) => void }[] = [];
  private scheduled = false;
  private dedupe = new Map<any, Promise<V>>();
  constructor(private readonly batchFn: BatchFn<K, V>) {}

  load(key: K): Promise<V> {
    // de-duplicate identical keys within the same microtask window
    if (this.dedupe.has(key as any)) {
      return this.dedupe.get(key as any)!;
    }
    const promise = new Promise<V>((resolve, reject) => {
      this.queue.push({ key, resolve, reject });
      if (!this.scheduled) {
        this.scheduled = true;
        queueMicrotask(() => this.flush());
      }
    });
    this.dedupe.set(key as any, promise);
    promise.finally(() => {
      // allow GC of key promises once settled
      this.dedupe.delete(key as any);
    });
    return promise;
  }

  private async flush() {
    const batch = this.queue;
    this.queue = [];
    this.scheduled = false;
    const keys = batch.map((q) => q.key);
    try {
      const results = await this.batchFn(keys);
      results.forEach((val, idx) => {
        const item = batch[idx];
        if (!item) return;
        if (val instanceof Error) item.reject(val);
        else item.resolve(val as V);
      });
    } catch (err) {
      batch.forEach((q) => q.reject(err));
    }
  }
}

export class BatchingService {
  private loaders = new Map<string, SimpleDataLoader<any, any>>();

  getOrCreateLoader<K, V>(name: string, batchFn: BatchFn<K, V>): SimpleDataLoader<K, V> {
    if (!this.loaders.has(name)) {
      this.loaders.set(name, new SimpleDataLoader<K, V>(batchFn));
    }
    return this.loaders.get(name)! as SimpleDataLoader<K, V>;
  }

  load<K, V>(name: string, key: K, batchFn: BatchFn<K, V>): Promise<V> {
    return this.getOrCreateLoader<K, V>(name, batchFn).load(key);
  }

  clear(name: string): void {
    this.loaders.delete(name);
  }
}

@Global()
@Module({
  providers: [{ provide: BatchingService, useClass: BatchingService, scope: Scope.REQUEST }],
  exports: [BatchingService],
})
export class BatchingModule {}
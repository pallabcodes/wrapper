import { Injectable } from '@nestjs/common';

@Injectable()
export class DemoService {
  sum(a: number, b: number): number {
    return a + b;
  }

  batchProcess(items: { id: string; value: number }[]) {
    const processed = items.map((it) => ({ id: it.id, doubled: it.value * 2 }));
    return { count: items.length, processed };
  }
}

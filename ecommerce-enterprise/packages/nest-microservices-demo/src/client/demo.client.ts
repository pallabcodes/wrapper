import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { DEMO_CLIENT } from './client.module';

@Injectable()
export class DemoClient implements OnModuleDestroy {
  constructor(@Inject(DEMO_CLIENT) private readonly client: ClientProxy) {}

  async sum(a: number, b: number): Promise<number> {
    const res$ = this.client.send<number, { a: number; b: number }>('sum', { a, b });
    return firstValueFrom(res$);
  }

  async batchProcess(items: { id: string; value: number }[]): Promise<{ count: number; processed: { id: string; doubled: number }[] }> {
    const res$ = this.client.send('batch-process', items);
    return firstValueFrom(res$);
  }

  streamTicks(count: number): Observable<{ i: number; at: number }> {
    return this.client.send('stream:ticks', count);
  }

  onModuleDestroy() {
    this.client.close();
  }
}

import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, GrpcMethod, MessagePattern, Payload, TcpContext } from '@nestjs/microservices';
import { Observable, interval, map, take } from 'rxjs';
import { DemoService } from './demo.service';

type Envelope<T> = { headers?: Record<string, string>; payload: T };
function unwrap<T>(data: T | Envelope<T>): T {
  if (data && typeof data === 'object' && 'payload' in (data as Record<string, unknown>)) {
    return (data as Envelope<T>).payload;
  }
  return data as T;
}

@Controller()
export class DemoController {
  constructor(private readonly demo: DemoService) {}

  @MessagePattern('sum')
  handleSum(@Payload() data: { a: number; b: number } | Envelope<{ a: number; b: number }>) {
    const d = unwrap(data);
    return this.demo.sum(d.a, d.b);
  }

  @MessagePattern('batch-process')
  handleBatch(@Payload() items: { id: string; value: number }[] | Envelope<{ id: string; value: number }[]>) {
    const list = unwrap(items);
    return this.demo.batchProcess(list);
  }

  @MessagePattern('stream:ticks')
  handleStreamTicks(@Payload() count: number | Envelope<number>): Observable<{ i: number; at: number }> {
    const c = unwrap(count);
    return interval(100).pipe(take(c), map((i: number) => ({ i, at: Date.now() })));
  }

  @EventPattern('user.created')
  handleUserCreated(@Payload() evt: { id: string } | Envelope<{ id: string }>) {
    const e = unwrap(evt);
    return { ok: true, id: e.id };
  }

  @MessagePattern('echo:context')
  handleEchoWithContext(@Payload() payload: unknown, @Ctx() context: TcpContext) {
    return {
      payload:
        payload && typeof payload === 'object' && 'payload' in (payload as Record<string, unknown>)
          ? (payload as Envelope<unknown>).payload
          : payload,
      pattern: context.getPattern(),
    };
  }

  @GrpcMethod('Demo', 'Sum')
  grpcSum(data: { a: number; b: number }): { result: number } {
    return { result: this.demo.sum(data.a, data.b) };
  }

  @GrpcMethod('Demo', 'BatchProcess')
  grpcBatch(req: { items: { id: string; value: number }[] }): { processed: number } {
    const result = this.demo.batchProcess(req.items);
    return { processed: result.count };
  }
}

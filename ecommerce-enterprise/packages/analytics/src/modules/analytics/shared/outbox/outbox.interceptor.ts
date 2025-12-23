import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map, Observable } from 'rxjs';
import { OUTBOX_EVENT } from './outbox.decorator';
import { OutboxService } from './outbox.module';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OutboxInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector, private readonly outbox: OutboxService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const handler = context.getHandler();
    const eventType = this.reflector.get<string | undefined>(OUTBOX_EVENT, handler);
    if (!eventType) return next.handle();

    return next.handle().pipe(
      map((body) => {
        const eventId = uuidv4();
        void this.outbox.enqueue({ id: eventId, type: eventType, payload: body, createdAt: Date.now() });
        return body;
      }),
    );
  }
}



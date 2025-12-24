import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

export interface DomainEvent {
    readonly eventName: string;
    readonly occurredAt: Date;
    readonly payload: Record<string, unknown>;
}

/**
 * In-Process Event Bus for inter-module communication.
 * 
 * This allows modules to communicate asynchronously without direct imports.
 * When you extract a module to a microservice, replace this with Kafka/RabbitMQ.
 */
@Injectable()
export class EventBus {
    private readonly subject = new Subject<DomainEvent>();

    publish(event: DomainEvent): void {
        this.subject.next(event);
    }

    on<T extends DomainEvent>(eventName: string): Observable<T> {
        return this.subject.pipe(
            filter((event): event is T => event.eventName === eventName),
        );
    }

    onAll(): Observable<DomainEvent> {
        return this.subject.asObservable();
    }
}

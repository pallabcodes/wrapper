
import { DomainEvent } from './domain-event';

export interface IEventBus {
    publish(event: DomainEvent): Promise<void>;
    publishAll(events: ReadonlyArray<DomainEvent>): Promise<void>;
}

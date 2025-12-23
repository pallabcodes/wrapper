import { AggregateRoot as NestAggregateRoot } from '@nestjs/cqrs';

export abstract class AggregateRoot extends NestAggregateRoot {
  constructor(protected readonly id: string) {
    super();
  }

  getId(): string {
    return this.id;
  }

  protected applyChange(event: any): void {
    this.apply(event);
    this.applyEvent(event);
  }

  protected abstract applyEvent(event: any): void;

  getUncommittedChanges(): any[] {
    return this.getUncommittedEvents();
  }

  markChangesAsCommitted(): void {
    this.uncommit();
  }

  loadFromHistory(events: any[]): void {
    events.forEach(event => this.applyEvent(event));
  }
}

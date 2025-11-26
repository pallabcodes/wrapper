export abstract class AggregateRoot {
  private _domainEvents: any[] = [];

  constructor(protected readonly id: string) {}

  getId(): string {
    return this.id;
  }

  protected addDomainEvent(domainEvent: any): void {
    this._domainEvents.push(domainEvent);
  }

  getDomainEvents(): any[] {
    return [...this._domainEvents];
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }
}

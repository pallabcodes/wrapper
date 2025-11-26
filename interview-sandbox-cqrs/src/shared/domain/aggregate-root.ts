export abstract class AggregateRoot {
  protected _changes: any[] = [];

  constructor(protected readonly id: string) {}

  getId(): string {
    return this.id;
  }

  protected applyChange(event: any): void {
    this._changes.push(event);
    this.applyEvent(event);
  }

  protected abstract applyEvent(event: any): void;

  getUncommittedChanges(): any[] {
    return [...this._changes];
  }

  markChangesAsCommitted(): void {
    this._changes = [];
  }

  loadFromHistory(events: any[]): void {
    events.forEach(event => this.applyEvent(event));
  }
}

import { Entity } from '@/core/entities/entity';
import type { UniqueEntityID } from '@/core/entities/unique-entity-id';
import type { DomainEvent } from '@/core/events/domain-event';
import { DomainEvents } from '@/core/events/domain-events';

export abstract class AggregateRoot<Props> extends Entity<Props> {
  private readonly _domainEvents: DomainEvent[] = [];

  protected constructor(props: Props, id?: UniqueEntityID) {
    super(props, id);
  }

  get domainEvents(): DomainEvent[] {
    return this._domainEvents;
  }

  clearEvents(): void {
    this._domainEvents.length = 0;
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
    DomainEvents.markAggregateForDispatch(this);
  }
}

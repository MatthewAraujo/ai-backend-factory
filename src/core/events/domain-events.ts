import type { AggregateRoot } from '@/core/entities/aggregate-root';
import type { UniqueEntityID } from '@/core/entities/unique-entity-id';
import type { DomainEvent } from '@/core/events/domain-event';

type DomainEventHandler = (event: DomainEvent) => void | Promise<void>;

const handlersMap = new Map<string, DomainEventHandler[]>();
let markedAggregates: AggregateRoot<unknown>[] = [];

export const DomainEvents = {
  clearHandlers(): void {
    handlersMap.clear();
  },

  clearMarkedAggregates(): void {
    markedAggregates = [];
  },

  async dispatchEventsForAggregate(aggregateId: UniqueEntityID): Promise<void> {
    const aggregate = markedAggregates.find((candidate) =>
      candidate.id.equals(aggregateId),
    );

    if (!aggregate) {
      return;
    }

    for (const event of aggregate.domainEvents) {
      await dispatch(event);
    }

    aggregate.clearEvents();
    markedAggregates = markedAggregates.filter(
      (candidate) => !candidate.id.equals(aggregateId),
    );
  },

  markAggregateForDispatch(aggregate: AggregateRoot<unknown>): void {
    const alreadyMarked = markedAggregates.some((candidate) =>
      candidate.id.equals(aggregate.id),
    );

    if (!alreadyMarked) {
      markedAggregates.push(aggregate);
    }
  },

  register(handler: DomainEventHandler, eventName: string): void {
    const handlers = handlersMap.get(eventName) ?? [];

    handlers.push(handler);
    handlersMap.set(eventName, handlers);
  },
};

async function dispatch(event: DomainEvent): Promise<void> {
  const eventName = event.constructor.name;
  const handlers = handlersMap.get(eventName) ?? [];

  for (const handler of handlers) {
    await handler(event);
  }
}

import { AggregateRoot } from '@/core/entities/aggregate-root';
import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import type { DomainEvent } from '@/core/events/domain-event';

class FakeDomainEvent implements DomainEvent {
  public readonly occurredAt = new Date('2026-07-01T22:00:00.000Z');

  constructor(private readonly aggregateId: UniqueEntityID) {}

  getAggregateId(): UniqueEntityID {
    return this.aggregateId;
  }
}

class TestEntity extends Entity<{ value: string }> {
  static create(value: string, id: UniqueEntityID): TestEntity {
    return new TestEntity({ value }, id);
  }
}

class TestAggregate extends AggregateRoot<{ value: string }> {
  static create(id?: UniqueEntityID): TestAggregate {
    return new TestAggregate({ value: 'initial' }, id);
  }

  recordEvent(): void {
    this.addDomainEvent(new FakeDomainEvent(this.id));
  }
}

describe('core entities', () => {
  it('compares UniqueEntityID instances by value', () => {
    const first = new UniqueEntityID('entity-1');
    const second = new UniqueEntityID('entity-1');
    const third = new UniqueEntityID('entity-2');

    expect(first.equals(second)).toBe(true);
    expect(first.equals(third)).toBe(false);
    expect(first.toString()).toBe('entity-1');
  });

  it('compares entities by identity instead of object reference', () => {
    const id = new UniqueEntityID('account-1');
    const first = TestEntity.create('first', id);
    const second = TestEntity.create('second', new UniqueEntityID('account-1'));
    const third = TestEntity.create('third', new UniqueEntityID('account-2'));

    expect(first.equals(second)).toBe(true);
    expect(first.equals(third)).toBe(false);
  });

  it('collects domain events on aggregate roots', () => {
    const aggregate = TestAggregate.create(new UniqueEntityID('job-1'));

    aggregate.recordEvent();

    expect(aggregate.domainEvents).toHaveLength(1);
    expect(aggregate.domainEvents[0]?.getAggregateId().toString()).toBe(
      'job-1',
    );

    aggregate.clearEvents();

    expect(aggregate.domainEvents).toHaveLength(0);
  });
});

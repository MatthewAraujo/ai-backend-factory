import type { UniqueEntityID } from '@/core/entities/unique-entity-id';
import type { DomainEvent } from '@/core/events/domain-event';
import type { GenerationJob } from '@/domain/factory/enterprise/entities/generation-job';

export class GenerationJobSucceededEvent implements DomainEvent {
  public readonly occurredAt: Date;

  constructor(public readonly generationJob: GenerationJob) {
    this.occurredAt = new Date();
  }

  getAggregateId(): UniqueEntityID {
    return this.generationJob.id;
  }
}

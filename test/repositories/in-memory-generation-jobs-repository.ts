import { DomainEvents } from '@/core/events/domain-events';
import type { GenerationJobsRepository } from '@/domain/factory/application/repositories/generation-jobs-repository';
import type { GenerationJob } from '@/domain/factory/enterprise/entities/generation-job';

export class InMemoryGenerationJobsRepository
  implements GenerationJobsRepository
{
  public items: GenerationJob[] = [];

  async create(job: GenerationJob): Promise<void> {
    this.items.push(job);
    await DomainEvents.dispatchEventsForAggregate(job.id);
  }

  async save(job: GenerationJob): Promise<void> {
    const itemIndex = this.items.findIndex((item) => item.id.equals(job.id));

    if (itemIndex >= 0) {
      this.items[itemIndex] = job;
    }

    await DomainEvents.dispatchEventsForAggregate(job.id);
  }

  async findById(id: string): Promise<GenerationJob | null> {
    return this.items.find((item) => item.id.toString() === id) ?? null;
  }

  async findManyByOwnerId(ownerId: string): Promise<GenerationJob[]> {
    return this.items
      .filter((item) => item.ownerId.toString() === ownerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

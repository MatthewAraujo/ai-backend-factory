import type { GenerationJob } from '@/domain/factory/enterprise/entities/generation-job';

export abstract class GenerationJobsRepository {
  abstract create(job: GenerationJob): Promise<void>;
  abstract save(job: GenerationJob): Promise<void>;
  abstract findById(id: string): Promise<GenerationJob | null>;
  abstract findManyByOwnerId(ownerId: string): Promise<GenerationJob[]>;
}

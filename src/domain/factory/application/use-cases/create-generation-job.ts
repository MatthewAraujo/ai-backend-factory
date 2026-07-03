import { Inject, Injectable } from '@nestjs/common';

import { type Either, right } from '@/core/either';
import { GenerationJobsRepository } from '@/domain/factory/application/repositories/generation-jobs-repository';
import { GenerationJobDispatcher } from '@/domain/factory/application/services/generation-job-dispatcher';
import { GenerationJob } from '@/domain/factory/enterprise/entities/generation-job';

type CreateGenerationJobUseCaseRequest = {
  notes: string;
  ownerId: string;
  projectDescription: string;
  projectName: string;
};

type CreateGenerationJobUseCaseResponse = Either<
  never,
  {
    generationJob: GenerationJob;
  }
>;

@Injectable()
export class CreateGenerationJobUseCase {
  constructor(
    @Inject(GenerationJobsRepository)
    private readonly generationJobsRepository: GenerationJobsRepository,
    @Inject(GenerationJobDispatcher)
    private readonly generationJobDispatcher: GenerationJobDispatcher,
  ) {}

  async execute({
    ownerId,
    projectName,
    projectDescription,
    notes,
  }: CreateGenerationJobUseCaseRequest): Promise<CreateGenerationJobUseCaseResponse> {
    const generationJob = GenerationJob.create({
      ownerId,
      projectName,
      projectDescription,
      notes,
    });

    await this.generationJobsRepository.create(generationJob);
    await this.generationJobDispatcher.dispatch(generationJob.id.toString());

    return right({
      generationJob,
    });
  }
}

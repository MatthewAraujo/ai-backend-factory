import { Inject, Injectable } from '@nestjs/common';

import { type Either, right } from '@/core/either';
import { GenerationJobsRepository } from '@/domain/factory/application/repositories/generation-jobs-repository';
import type { GenerationJob } from '@/domain/factory/enterprise/entities/generation-job';

type ListUserGenerationJobsUseCaseRequest = {
  ownerId: string;
};

type ListUserGenerationJobsUseCaseResponse = Either<
  never,
  {
    generationJobs: GenerationJob[];
  }
>;

@Injectable()
export class ListUserGenerationJobsUseCase {
  constructor(
    @Inject(GenerationJobsRepository)
    private readonly generationJobsRepository: GenerationJobsRepository,
  ) {}

  async execute({
    ownerId,
  }: ListUserGenerationJobsUseCaseRequest): Promise<ListUserGenerationJobsUseCaseResponse> {
    const generationJobs =
      await this.generationJobsRepository.findManyByOwnerId(ownerId);

    return right({
      generationJobs,
    });
  }
}

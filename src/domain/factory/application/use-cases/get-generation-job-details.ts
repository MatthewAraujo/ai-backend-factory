import { Inject, Injectable } from '@nestjs/common';

import { type Either, left, right } from '@/core/either';
import { GenerationJobsRepository } from '@/domain/factory/application/repositories/generation-jobs-repository';
import { ResourceNotFoundError } from '@/domain/factory/application/use-cases/errors/resource-not-found-error';
import type { GenerationJob } from '@/domain/factory/enterprise/entities/generation-job';

type GetGenerationJobDetailsUseCaseRequest = {
  generationJobId: string;
  ownerId: string;
};

type GetGenerationJobDetailsUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    generationJob: GenerationJob;
  }
>;

@Injectable()
export class GetGenerationJobDetailsUseCase {
  constructor(
    @Inject(GenerationJobsRepository)
    private readonly generationJobsRepository: GenerationJobsRepository,
  ) {}

  async execute({
    generationJobId,
    ownerId,
  }: GetGenerationJobDetailsUseCaseRequest): Promise<GetGenerationJobDetailsUseCaseResponse> {
    const generationJob =
      await this.generationJobsRepository.findById(generationJobId);

    if (!generationJob || generationJob.ownerId.toString() !== ownerId) {
      return left(new ResourceNotFoundError());
    }

    return right({
      generationJob,
    });
  }
}

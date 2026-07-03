import { Inject, Injectable } from '@nestjs/common';

import { type Either, left, right } from '@/core/either';
import { GenerationJobsRepository } from '@/domain/factory/application/repositories/generation-jobs-repository';
import { GeneratedServiceGenerator } from '@/domain/factory/application/services/generated-service-generator';
import { ResourceNotFoundError } from '@/domain/factory/application/use-cases/errors/resource-not-found-error';
import {
  type GenerationJob,
  GenerationJobState,
} from '@/domain/factory/enterprise/entities/generation-job';

type ProcessGenerationJobUseCaseRequest = {
  generationJobId: string;
};

type ProcessGenerationJobUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    generationJob: GenerationJob;
  }
>;

@Injectable()
export class ProcessGenerationJobUseCase {
  constructor(
    @Inject(GenerationJobsRepository)
    private readonly generationJobsRepository: GenerationJobsRepository,
    @Inject(GeneratedServiceGenerator)
    private readonly generatedServiceGenerator: GeneratedServiceGenerator,
  ) {}

  async execute({
    generationJobId,
  }: ProcessGenerationJobUseCaseRequest): Promise<ProcessGenerationJobUseCaseResponse> {
    const generationJob =
      await this.generationJobsRepository.findById(generationJobId);

    if (!generationJob) {
      return left(new ResourceNotFoundError());
    }

    if (generationJob.state !== GenerationJobState.PENDING) {
      return right({
        generationJob,
      });
    }

    generationJob.start();
    await this.generationJobsRepository.save(generationJob);

    try {
      const generatedService = await this.generatedServiceGenerator.generate({
        generationJob,
      });

      generationJob.succeed(generatedService.outputPath);
      await this.generationJobsRepository.save(generationJob);
    } catch (error) {
      if (!isRunning(generationJob)) {
        throw error;
      }

      generationJob.fail(resolveFailureReason(error));
      await this.generationJobsRepository.save(generationJob);
    }

    return right({
      generationJob,
    });
  }
}

function isRunning(generationJob: GenerationJob): boolean {
  return generationJob.state === GenerationJobState.RUNNING;
}

function resolveFailureReason(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.trim();

    if (message.length > 0) {
      return message;
    }
  }

  return 'Generation failed unexpectedly.';
}

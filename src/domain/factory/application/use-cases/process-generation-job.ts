import { Inject, Injectable } from '@nestjs/common';

import { type Either, left, right } from '@/core/either';
import { GenerationJobsRepository } from '@/domain/factory/application/repositories/generation-jobs-repository';
import {
  GeneratedServiceGenerationError,
  GeneratedServiceGenerator,
  type GeneratedServiceMetadata,
} from '@/domain/factory/application/services/generated-service-generator';
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

      generationJob.succeed(generatedService.outputPath, new Date(), {
        featureScopeRelativePath: generatedService.featureScopeRelativePath,
        repositoryPath: generatedService.repositoryPath,
      });
      await this.generationJobsRepository.save(generationJob);
    } catch (error) {
      if (!isRunning(generationJob)) {
        throw error;
      }

      const failure = resolveFailure(error);

      generationJob.fail(failure.reason, new Date(), failure);
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

function resolveFailure(
  error: unknown,
): GeneratedServiceMetadata & { reason: string } {
  if (error instanceof GeneratedServiceGenerationError) {
    return {
      reason: resolveFailureReason(error),
      repositoryPath: error.repositoryPath,
      featureScopeRelativePath: error.featureScopeRelativePath,
    };
  }

  return {
    reason: resolveFailureReason(error),
    repositoryPath: null,
    featureScopeRelativePath: null,
  };
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

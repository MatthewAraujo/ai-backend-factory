import { Inject, Injectable } from '@nestjs/common';

import type { GenerationJobDispatcher } from '@/domain/factory/application/services/generation-job-dispatcher';
import { ProcessGenerationJobUseCase } from '@/domain/factory/application/use-cases/process-generation-job';

@Injectable()
export class InProcessGenerationJobDispatcher
  implements GenerationJobDispatcher
{
  constructor(
    @Inject(ProcessGenerationJobUseCase)
    private readonly processGenerationJobUseCase: ProcessGenerationJobUseCase,
  ) {}

  async dispatch(generationJobId: string): Promise<void> {
    setImmediate(() => {
      void this.processGenerationJobUseCase.execute({
        generationJobId,
      });
    });
  }
}

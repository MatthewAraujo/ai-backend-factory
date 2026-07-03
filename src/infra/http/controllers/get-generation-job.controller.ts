import { Controller, Get, Inject, Param, UseGuards } from '@nestjs/common';
import { z } from 'zod';

import { GetGenerationJobDetailsUseCase } from '@/domain/factory/application/use-cases/get-generation-job-details';
import type { CurrentUser as CurrentUserView } from '@/infra/auth/current-user';
import { CurrentUser } from '@/infra/auth/current-user.decorator';
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';
import { presentGenerationJob } from '@/infra/http/presenters/generation-job.presenter';
import { presentUseCaseError } from '@/infra/http/presenters/use-case-error-presenter';

const getGenerationJobParamsSchema = z.object({
  id: z.string().min(1),
});

type GetGenerationJobParamsSchema = z.infer<
  typeof getGenerationJobParamsSchema
>;

@Controller('/generation-jobs/:id')
export class GetGenerationJobController {
  constructor(
    @Inject(GetGenerationJobDetailsUseCase)
    private readonly getGenerationJobDetails: GetGenerationJobDetailsUseCase,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async handle(
    @CurrentUser() currentUser: CurrentUserView,
    @Param(new ZodValidationPipe(getGenerationJobParamsSchema))
    params: GetGenerationJobParamsSchema,
  ) {
    const result = await this.getGenerationJobDetails.execute({
      ownerId: currentUser.id,
      generationJobId: params.id,
    });

    if (result.isLeft()) {
      throw presentUseCaseError(result.value);
    }

    return {
      generationJob: presentGenerationJob(result.value.generationJob),
    };
  }
}

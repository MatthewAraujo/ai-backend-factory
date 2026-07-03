import { Controller, Get, Inject, UseGuards } from '@nestjs/common';

import { ListUserGenerationJobsUseCase } from '@/domain/factory/application/use-cases/list-user-generation-jobs';
import type { CurrentUser as CurrentUserView } from '@/infra/auth/current-user';
import { CurrentUser } from '@/infra/auth/current-user.decorator';
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard';
import { presentGenerationJob } from '@/infra/http/presenters/generation-job.presenter';

@Controller('/generation-jobs')
export class ListGenerationJobsController {
  constructor(
    @Inject(ListUserGenerationJobsUseCase)
    private readonly listUserGenerationJobs: ListUserGenerationJobsUseCase,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async handle(@CurrentUser() currentUser: CurrentUserView) {
    const result = await this.listUserGenerationJobs.execute({
      ownerId: currentUser.id,
    });

    return {
      generationJobs: result.value.generationJobs.map(presentGenerationJob),
    };
  }
}

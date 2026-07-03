import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';

import { CreateGenerationJobUseCase } from '@/domain/factory/application/use-cases/create-generation-job';
import type { CurrentUser as CurrentUserView } from '@/infra/auth/current-user';
import { CurrentUser } from '@/infra/auth/current-user.decorator';
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';
import { presentGenerationJob } from '@/infra/http/presenters/generation-job.presenter';

const createGenerationJobBodySchema = z.object({
  projectName: z.string().min(1),
  projectDescription: z.string().min(1),
  notes: z.string(),
});

type CreateGenerationJobBodySchema = z.infer<
  typeof createGenerationJobBodySchema
>;

@Controller('/generation-jobs')
export class CreateGenerationJobController {
  constructor(
    @Inject(CreateGenerationJobUseCase)
    private readonly createGenerationJob: CreateGenerationJobUseCase,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async handle(
    @CurrentUser() currentUser: CurrentUserView,
    @Body(new ZodValidationPipe(createGenerationJobBodySchema))
    body: CreateGenerationJobBodySchema,
  ) {
    const result = await this.createGenerationJob.execute({
      ownerId: currentUser.id,
      projectName: body.projectName,
      projectDescription: body.projectDescription,
      notes: body.notes,
    });

    return {
      generationJob: presentGenerationJob(result.value.generationJob),
    };
  }
}

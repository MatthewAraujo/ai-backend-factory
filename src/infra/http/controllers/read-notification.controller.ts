import { Controller, HttpCode, HttpStatus, Inject, Param, Patch, UseGuards } from '@nestjs/common';
import { z } from 'zod';

import { ReadNotificationUseCase } from '@/domain/notification/application/use-cases/read-notification';
import type { CurrentUser as CurrentUserView } from '@/infra/auth/current-user';
import { CurrentUser } from '@/infra/auth/current-user.decorator';
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';
import { presentNotification } from '@/infra/http/presenters/notification.presenter';
import { presentUseCaseError } from '@/infra/http/presenters/use-case-error-presenter';

const readNotificationParamsSchema = z.object({
  notificationId: z.string().min(1),
});

type ReadNotificationParamsSchema = z.infer<typeof readNotificationParamsSchema>;

@Controller('/notifications')
export class ReadNotificationController {
  constructor(
    @Inject(ReadNotificationUseCase)
    private readonly readNotification: ReadNotificationUseCase,
  ) {}

  @Patch('/:notificationId/read')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async handle(
    @CurrentUser() currentUser: CurrentUserView,
    @Param(new ZodValidationPipe(readNotificationParamsSchema))
    params: ReadNotificationParamsSchema,
  ) {
    const result = await this.readNotification.execute({
      ownerId: currentUser.id,
      notificationId: params.notificationId,
    });

    if (result.isLeft()) {
      throw presentUseCaseError(result.value);
    }

    return {
      notification: presentNotification(result.value.notification),
    };
  }
}

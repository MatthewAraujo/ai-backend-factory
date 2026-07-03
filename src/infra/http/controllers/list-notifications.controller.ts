import { Controller, Get, Inject, UseGuards } from '@nestjs/common';

import { ListNotificationsUseCase } from '@/domain/notification/application/use-cases/list-notifications';
import type { CurrentUser as CurrentUserView } from '@/infra/auth/current-user';
import { CurrentUser } from '@/infra/auth/current-user.decorator';
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard';
import { presentNotification } from '@/infra/http/presenters/notification.presenter';

@Controller('/notifications')
export class ListNotificationsController {
  constructor(
    @Inject(ListNotificationsUseCase)
    private readonly listNotifications: ListNotificationsUseCase,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async handle(@CurrentUser() currentUser: CurrentUserView) {
    const result = await this.listNotifications.execute({
      ownerId: currentUser.id,
    });

    return {
      notifications: result.value.notifications.map(presentNotification),
    };
  }
}

import { Inject, Injectable } from '@nestjs/common';

import { type Either, right } from '@/core/either';
import { NotificationsRepository } from '@/domain/notification/application/repositories/notifications-repository';
import type { Notification } from '@/domain/notification/enterprise/entities/notification';

type ListNotificationsUseCaseRequest = {
  ownerId: string;
};

type ListNotificationsUseCaseResponse = Either<
  never,
  {
    notifications: Notification[];
  }
>;

@Injectable()
export class ListNotificationsUseCase {
  constructor(
    @Inject(NotificationsRepository)
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  async execute({
    ownerId,
  }: ListNotificationsUseCaseRequest): Promise<ListNotificationsUseCaseResponse> {
    const notifications =
      await this.notificationsRepository.findManyByOwnerId(ownerId);

    return right({
      notifications,
    });
  }
}

import { Inject, Injectable } from '@nestjs/common';

import { type Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '@/domain/factory/application/use-cases/errors/resource-not-found-error';
import { NotificationsRepository } from '@/domain/notification/application/repositories/notifications-repository';
import type { Notification } from '@/domain/notification/enterprise/entities/notification';

type ReadNotificationUseCaseRequest = {
  notificationId: string;
  ownerId: string;
};

type ReadNotificationUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    notification: Notification;
  }
>;

@Injectable()
export class ReadNotificationUseCase {
  constructor(
    @Inject(NotificationsRepository)
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  async execute({
    notificationId,
    ownerId,
  }: ReadNotificationUseCaseRequest): Promise<ReadNotificationUseCaseResponse> {
    const notification =
      await this.notificationsRepository.findById(notificationId);

    if (!notification || notification.ownerId.toString() !== ownerId) {
      return left(new ResourceNotFoundError());
    }

    notification.markAsRead();
    await this.notificationsRepository.save(notification);

    return right({
      notification,
    });
  }
}

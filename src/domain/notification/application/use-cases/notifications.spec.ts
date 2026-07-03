import { ResourceNotFoundError } from '@/domain/factory/application/use-cases/errors/resource-not-found-error';
import { ListNotificationsUseCase } from '@/domain/notification/application/use-cases/list-notifications';
import { ReadNotificationUseCase } from '@/domain/notification/application/use-cases/read-notification';

import { makeNotification } from '../../../../../test/factories/make-notification';
import { InMemoryNotificationsRepository } from '../../../../../test/repositories/in-memory-notifications-repository';

describe('Notification use cases', () => {
  it('lists only notifications owned by the requested account in reverse chronological order', async () => {
    const notificationsRepository = new InMemoryNotificationsRepository();
    const sut = new ListNotificationsUseCase(notificationsRepository);

    await notificationsRepository.create(
      makeNotification({
        id: 'notification-1',
        ownerId: 'owner-1',
        title: 'Older',
        createdAt: new Date('2026-07-02T10:00:00.000Z'),
      }),
    );
    await notificationsRepository.create(
      makeNotification({
        id: 'notification-2',
        ownerId: 'owner-1',
        title: 'Newer',
        createdAt: new Date('2026-07-02T10:05:00.000Z'),
      }),
    );
    await notificationsRepository.create(
      makeNotification({
        id: 'notification-3',
        ownerId: 'owner-2',
        title: 'Foreign',
        createdAt: new Date('2026-07-02T10:10:00.000Z'),
      }),
    );

    const result = await sut.execute({
      ownerId: 'owner-1',
    });

    expect(result.isRight()).toBe(true);
    expect(
      result.value.notifications.map((notification) =>
        notification.id.toString(),
      ),
    ).toEqual(['notification-2', 'notification-1']);
  });

  it('marks an owned notification as read', async () => {
    const notificationsRepository = new InMemoryNotificationsRepository();
    const sut = new ReadNotificationUseCase(notificationsRepository);

    await notificationsRepository.create(
      makeNotification({
        id: 'notification-1',
        ownerId: 'owner-1',
        readAt: null,
      }),
    );

    const result = await sut.execute({
      ownerId: 'owner-1',
      notificationId: 'notification-1',
    });

    expect(result.isRight()).toBe(true);
    if (result.isLeft()) {
      throw result.value;
    }
    expect(result.value.notification.isRead).toBe(true);
    expect(result.value.notification.readAt).toEqual(expect.any(Date));
  });

  it('rejects reading a notification for a different owner', async () => {
    const notificationsRepository = new InMemoryNotificationsRepository();
    const sut = new ReadNotificationUseCase(notificationsRepository);

    await notificationsRepository.create(
      makeNotification({
        id: 'notification-1',
        ownerId: 'owner-1',
      }),
    );

    const result = await sut.execute({
      ownerId: 'owner-2',
      notificationId: 'notification-1',
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });
});

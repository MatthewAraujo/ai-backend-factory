import type { NotificationsRepository } from '@/domain/notification/application/repositories/notifications-repository';
import type { Notification } from '@/domain/notification/enterprise/entities/notification';

export class InMemoryNotificationsRepository
  implements NotificationsRepository
{
  public items: Notification[] = [];

  async create(notification: Notification): Promise<void> {
    this.items.push(notification);
  }

  async save(notification: Notification): Promise<void> {
    const itemIndex = this.items.findIndex((item) =>
      item.id.equals(notification.id),
    );

    if (itemIndex >= 0) {
      this.items[itemIndex] = notification;
    }
  }

  async findById(id: string): Promise<Notification | null> {
    return this.items.find((item) => item.id.toString() === id) ?? null;
  }

  async findManyByOwnerId(ownerId: string): Promise<Notification[]> {
    return this.items
      .filter((item) => item.ownerId.toString() === ownerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

import type { Notification } from '@/domain/notification/enterprise/entities/notification';

export function presentNotification(notification: Notification) {
  return {
    id: notification.id.toString(),
    ownerId: notification.ownerId.toString(),
    generationJobId: notification.generationJobId?.toString() ?? null,
    type: notification.type,
    title: notification.title,
    content: notification.content,
    isRead: notification.isRead,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
  };
}

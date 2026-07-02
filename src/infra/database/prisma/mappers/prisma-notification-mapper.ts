import type {
  Notification as PrismaNotification,
  NotificationType as PrismaNotificationType,
} from '@prisma/client';

import {
  Notification,
  type NotificationType,
} from '@/domain/notification/enterprise/entities/notification';

export function toDomainNotification(raw: PrismaNotification): Notification {
  return Notification.create(
    {
      ownerId: raw.ownerId,
      generationJobId: raw.generationJobId,
      type: raw.type as NotificationType,
      title: raw.title,
      content: raw.content,
      readAt: raw.readAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    raw.id,
  );
}

export function toPrismaNotification(
  notification: Notification,
): PrismaNotification {
  return {
    id: notification.id.toString(),
    ownerId: notification.ownerId.toString(),
    generationJobId: notification.generationJobId?.toString() ?? null,
    type: notification.type as PrismaNotificationType,
    title: notification.title,
    content: notification.content,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
  };
}

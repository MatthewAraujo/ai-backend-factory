import { Inject, Injectable } from '@nestjs/common';
import type { Notification as PrismaNotification } from '@prisma/client';

import type { NotificationsRepository } from '@/domain/notification/application/repositories/notifications-repository';
import type { Notification } from '@/domain/notification/enterprise/entities/notification';
import {
  toDomainNotification,
  toPrismaNotification,
} from '@/infra/database/prisma/mappers/prisma-notification-mapper';
import { PrismaService } from '@/infra/database/prisma/prisma.service';

type PrismaNotificationsClient = {
  notification: {
    create(args: { data: PrismaNotification }): Promise<PrismaNotification>;
    update(args: {
      data: PrismaNotification;
      where: { id: string };
    }): Promise<PrismaNotification>;
    findUnique(args: {
      where: { id: string };
    }): Promise<PrismaNotification | null>;
    findMany(args: {
      orderBy: { createdAt: 'desc' };
      where: { ownerId: string };
    }): Promise<PrismaNotification[]>;
  };
};

@Injectable()
export class PrismaNotificationsRepository implements NotificationsRepository {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaNotificationsClient,
  ) {}

  async create(notification: Notification): Promise<void> {
    await this.prisma.notification.create({
      data: toPrismaNotification(notification),
    });
  }

  async save(notification: Notification): Promise<void> {
    await this.prisma.notification.update({
      where: {
        id: notification.id.toString(),
      },
      data: toPrismaNotification(notification),
    });
  }

  async findById(id: string): Promise<Notification | null> {
    const notification = await this.prisma.notification.findUnique({
      where: {
        id,
      },
    });

    if (!notification) {
      return null;
    }

    return toDomainNotification(notification);
  }

  async findManyByOwnerId(ownerId: string): Promise<Notification[]> {
    const notifications = await this.prisma.notification.findMany({
      where: {
        ownerId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return notifications.map(toDomainNotification);
  }
}

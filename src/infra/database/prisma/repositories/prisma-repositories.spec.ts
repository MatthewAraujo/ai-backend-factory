import { PrismaAccountsRepository } from '@/infra/database/prisma/repositories/prisma-accounts-repository';
import { PrismaGenerationJobsRepository } from '@/infra/database/prisma/repositories/prisma-generation-jobs-repository';
import { PrismaNotificationsRepository } from '@/infra/database/prisma/repositories/prisma-notifications-repository';

import { makeAccount } from '../../../../../test/factories/make-account';
import { makeGenerationJob } from '../../../../../test/factories/make-generation-job';
import { makeNotification } from '../../../../../test/factories/make-notification';
import { createFakePrismaService } from '../../../../../test/repositories/fake-prisma.service';

describe('Prisma repositories', () => {
  it('stores accounts and finds them by normalized email', async () => {
    const prisma = createFakePrismaService();
    const repository = new PrismaAccountsRepository(prisma);
    const account = makeAccount({
      email: 'Factory.User@Example.com',
    });

    await repository.create(account);

    const foundAccount = await repository.findByEmail(
      '  FACTORY.USER@example.com ',
    );

    expect(foundAccount).not.toBeNull();
    expect(foundAccount?.id).toBe(account.id);
    expect(foundAccount?.email).toBe('factory.user@example.com');
  });

  it('lists only generation jobs owned by the requested account and preserves metadata', async () => {
    const prisma = createFakePrismaService();
    const repository = new PrismaGenerationJobsRepository(prisma);
    const ownerJob = makeGenerationJob({
      id: 'job-1',
      ownerId: 'owner-1',
      createdAt: new Date('2026-07-01T21:00:00.000Z'),
    });
    const newerOwnerJob = makeGenerationJob({
      id: 'job-2',
      ownerId: 'owner-1',
      createdAt: new Date('2026-07-01T21:02:00.000Z'),
    });
    const foreignJob = makeGenerationJob({
      id: 'job-3',
      ownerId: 'owner-2',
      createdAt: new Date('2026-07-01T21:03:00.000Z'),
    });

    newerOwnerJob.start(new Date('2026-07-01T21:04:00.000Z'));
    newerOwnerJob.succeed(
      '/home/matthew/personal/ai-backend-factory/repos/factory-crm',
      new Date('2026-07-01T21:05:00.000Z'),
    );

    await repository.create(ownerJob);
    await repository.create(newerOwnerJob);
    await repository.create(foreignJob);

    const jobs = await repository.findManyByOwnerId('owner-1');

    expect(jobs).toHaveLength(2);
    expect(jobs.map((job) => job.id)).toEqual(['job-2', 'job-1']);
    expect(jobs[0]?.outputPath).toBe(
      '/home/matthew/personal/ai-backend-factory/repos/factory-crm',
    );
    expect(jobs[0]?.completedAt).toEqual(new Date('2026-07-01T21:05:00.000Z'));
    expect(jobs[1]?.outputPath).toBeNull();
  });

  it('lists only notifications for the requested owner and persists read state', async () => {
    const prisma = createFakePrismaService();
    const repository = new PrismaNotificationsRepository(prisma);
    const unreadNotification = makeNotification({
      id: 'notification-1',
      ownerId: 'owner-1',
      createdAt: new Date('2026-07-01T21:00:00.000Z'),
    });
    const readNotification = makeNotification({
      id: 'notification-2',
      ownerId: 'owner-1',
      createdAt: new Date('2026-07-01T21:05:00.000Z'),
    });
    const foreignNotification = makeNotification({
      id: 'notification-3',
      ownerId: 'owner-2',
      createdAt: new Date('2026-07-01T21:06:00.000Z'),
    });

    readNotification.markAsRead(new Date('2026-07-01T21:10:00.000Z'));

    await repository.create(unreadNotification);
    await repository.create(readNotification);
    await repository.create(foreignNotification);

    const notifications = await repository.findManyByOwnerId('owner-1');

    expect(notifications).toHaveLength(2);
    expect(notifications.map((notification) => notification.id)).toEqual([
      'notification-2',
      'notification-1',
    ]);
    expect(notifications[0]?.readAt).toEqual(
      new Date('2026-07-01T21:10:00.000Z'),
    );
    expect(notifications[1]?.readAt).toBeNull();
  });
});

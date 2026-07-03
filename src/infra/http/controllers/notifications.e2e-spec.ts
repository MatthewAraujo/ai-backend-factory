import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AccountsRepository } from '@/domain/factory/application/repositories/accounts-repository';
import { NotificationsRepository } from '@/domain/notification/application/repositories/notifications-repository';
import { AppModule } from '@/infra/app.module';
import { makeNotification } from '../../../../test/factories/make-notification';
import { InMemoryAccountsRepository } from '../../../../test/repositories/in-memory-accounts-repository';
import { InMemoryNotificationsRepository } from '../../../../test/repositories/in-memory-notifications-repository';

describe('Notifications (e2e)', () => {
  let app: INestApplication;
  let notificationsRepository: InMemoryNotificationsRepository;

  beforeAll(async () => {
    const accountsRepository = new InMemoryAccountsRepository();
    notificationsRepository = new InMemoryNotificationsRepository();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AccountsRepository)
      .useValue(accountsRepository)
      .overrideProvider(NotificationsRepository)
      .useValue(notificationsRepository)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  async function createAccountAndAuthenticate(email: string) {
    await request(app.getHttpServer()).post('/accounts').send({
      email,
      password: 'secret-123',
    });

    const sessionResponse = await request(app.getHttpServer())
      .post('/sessions')
      .send({
        email,
        password: 'secret-123',
      });

    return sessionResponse.body.accessToken as string;
  }

  it('lists only notifications owned by the authenticated user', async () => {
    const accessToken = await createAccountAndAuthenticate(
      'notifications.list.owner@example.com',
    );
    const foreignAccessToken = await createAccountAndAuthenticate(
      'notifications.list.foreign@example.com',
    );

    await request(app.getHttpServer())
      .post('/generation-jobs')
      .set('authorization', `Bearer ${accessToken}`)
      .send({
        projectName: 'Owner job',
        projectDescription: 'Owned by the caller',
        notes: 'owner notes',
      });

    await request(app.getHttpServer())
      .post('/generation-jobs')
      .set('authorization', `Bearer ${foreignAccessToken}`)
      .send({
        projectName: 'Foreign job',
        projectDescription: 'Owned by a different user',
        notes: 'foreign notes',
      });

    const ownerJob = (
      await request(app.getHttpServer())
        .get('/generation-jobs')
        .set('authorization', `Bearer ${accessToken}`)
    ).body.generationJobs[0];

    const foreignJob = (
      await request(app.getHttpServer())
        .get('/generation-jobs')
        .set('authorization', `Bearer ${foreignAccessToken}`)
    ).body.generationJobs[0];

    await notificationsRepository.create(
      makeNotification({
        id: 'notification-1',
        ownerId: ownerJob.ownerId,
        generationJobId: ownerJob.id,
        title: 'Owner notification',
        content: 'Ready for the owner.',
      }),
    );
    await notificationsRepository.create(
      makeNotification({
        id: 'notification-2',
        ownerId: foreignJob.ownerId,
        generationJobId: foreignJob.id,
        title: 'Foreign notification',
        content: 'Should stay hidden.',
      }),
    );

    const response = await request(app.getHttpServer())
      .get('/notifications')
      .set('authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.notifications).toHaveLength(1);
    expect(response.body.notifications[0]).toMatchObject({
      id: 'notification-1',
      title: 'Owner notification',
      content: 'Ready for the owner.',
      isRead: false,
    });
  });

  it('marks one owned notification as read', async () => {
    const accessToken = await createAccountAndAuthenticate(
      'notifications.read.owner@example.com',
    );

    await request(app.getHttpServer())
      .post('/generation-jobs')
      .set('authorization', `Bearer ${accessToken}`)
      .send({
        projectName: 'Notification job',
        projectDescription: 'Creates a job for notification ownership',
        notes: 'notes',
      });

    const ownerJob = (
      await request(app.getHttpServer())
        .get('/generation-jobs')
        .set('authorization', `Bearer ${accessToken}`)
    ).body.generationJobs[0];

    await notificationsRepository.create(
      makeNotification({
        id: 'notification-read-1',
        ownerId: ownerJob.ownerId,
        generationJobId: ownerJob.id,
        readAt: null,
      }),
    );

    const response = await request(app.getHttpServer())
      .patch('/notifications/notification-read-1/read')
      .set('authorization', `Bearer ${accessToken}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body.notification).toMatchObject({
      id: 'notification-read-1',
      isRead: true,
      readAt: expect.any(String),
    });
  });

  it('denies cross-user notification reads', async () => {
    const ownerAccessToken = await createAccountAndAuthenticate(
      'notifications.get.owner@example.com',
    );
    const foreignAccessToken = await createAccountAndAuthenticate(
      'notifications.get.foreign@example.com',
    );

    await request(app.getHttpServer())
      .post('/generation-jobs')
      .set('authorization', `Bearer ${ownerAccessToken}`)
      .send({
        projectName: 'Private notification job',
        projectDescription: 'Should not leak across users',
        notes: 'private notes',
      });

    const ownerJob = (
      await request(app.getHttpServer())
        .get('/generation-jobs')
        .set('authorization', `Bearer ${ownerAccessToken}`)
    ).body.generationJobs[0];

    await notificationsRepository.create(
      makeNotification({
        id: 'notification-private-1',
        ownerId: ownerJob.ownerId,
        generationJobId: ownerJob.id,
      }),
    );

    const response = await request(app.getHttpServer())
      .patch('/notifications/notification-private-1/read')
      .set('authorization', `Bearer ${foreignAccessToken}`)
      .send();

    expect(response.status).toBe(404);
  });
});

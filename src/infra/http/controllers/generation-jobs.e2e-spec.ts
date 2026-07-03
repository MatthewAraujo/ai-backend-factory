import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AccountsRepository } from '@/domain/factory/application/repositories/accounts-repository';
import { GenerationJobsRepository } from '@/domain/factory/application/repositories/generation-jobs-repository';
import { AppModule } from '@/infra/app.module';
import { InMemoryAccountsRepository } from '../../../../test/repositories/in-memory-accounts-repository';
import { InMemoryGenerationJobsRepository } from '../../../../test/repositories/in-memory-generation-jobs-repository';

describe('Generation jobs (e2e)', () => {
  let app: INestApplication;
  let jobsRepository: InMemoryGenerationJobsRepository;

  beforeAll(async () => {
    const accountsRepository = new InMemoryAccountsRepository();
    jobsRepository = new InMemoryGenerationJobsRepository();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AccountsRepository)
      .useValue(accountsRepository)
      .overrideProvider(GenerationJobsRepository)
      .useValue(jobsRepository)
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

  it('creates a pending generation job for the authenticated user', async () => {
    const accessToken = await createAccountAndAuthenticate(
      'jobs.create@example.com',
    );

    const response = await request(app.getHttpServer())
      .post('/generation-jobs')
      .set('authorization', `Bearer ${accessToken}`)
      .send({
        projectName: 'Factory CRM',
        projectDescription: 'A deterministic CRM starter',
        notes: 'Include audit logging later',
      });

    expect(response.status).toBe(201);
    expect(response.body.generationJob).toMatchObject({
      id: expect.any(String),
      projectName: 'Factory CRM',
      projectDescription: 'A deterministic CRM starter',
      notes: 'Include audit logging later',
      state: 'PENDING',
      outputPath: null,
      failureReason: null,
    });
  });

  it('lists only generation jobs owned by the authenticated user', async () => {
    const accessToken = await createAccountAndAuthenticate(
      'jobs.list.owner@example.com',
    );
    const foreignAccessToken = await createAccountAndAuthenticate(
      'jobs.list.foreign@example.com',
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

    const response = await request(app.getHttpServer())
      .get('/generation-jobs')
      .set('authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.generationJobs).toHaveLength(1);
    expect(response.body.generationJobs[0]).toMatchObject({
      projectName: 'Owner job',
    });
  });

  it('denies cross-user access to generation job details', async () => {
    const ownerAccessToken = await createAccountAndAuthenticate(
      'jobs.get.owner@example.com',
    );
    const foreignAccessToken = await createAccountAndAuthenticate(
      'jobs.get.foreign@example.com',
    );

    const createResponse = await request(app.getHttpServer())
      .post('/generation-jobs')
      .set('authorization', `Bearer ${ownerAccessToken}`)
      .send({
        projectName: 'Private job',
        projectDescription: 'Should not leak across users',
        notes: 'private notes',
      });

    const response = await request(app.getHttpServer())
      .get(`/generation-jobs/${createResponse.body.generationJob.id}`)
      .set('authorization', `Bearer ${foreignAccessToken}`);

    expect(response.status).toBe(404);
  });
});

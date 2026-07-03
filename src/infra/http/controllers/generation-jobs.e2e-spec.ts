import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AccountsRepository } from '@/domain/factory/application/repositories/accounts-repository';
import { GenerationJobsRepository } from '@/domain/factory/application/repositories/generation-jobs-repository';
import { GenerationJobState } from '@/domain/factory/enterprise/entities/generation-job';
import { NotificationsRepository } from '@/domain/notification/application/repositories/notifications-repository';
import { AppModule } from '@/infra/app.module';
import { WorkspaceRootPathProvider } from '@/infra/filesystem/workspace-root-path-provider';
import { InMemoryAccountsRepository } from '../../../../test/repositories/in-memory-accounts-repository';
import { InMemoryGenerationJobsRepository } from '../../../../test/repositories/in-memory-generation-jobs-repository';
import { InMemoryNotificationsRepository } from '../../../../test/repositories/in-memory-notifications-repository';

class StaticWorkspaceRootPathProvider implements WorkspaceRootPathProvider {
  constructor(private readonly workspaceRoot: string) {}

  getPath(): string {
    return this.workspaceRoot;
  }
}

describe('Generation jobs (e2e)', () => {
  let app: INestApplication;
  let jobsRepository: InMemoryGenerationJobsRepository;
  let workspaceRoot: string;

  beforeAll(async () => {
    const accountsRepository = new InMemoryAccountsRepository();
    jobsRepository = new InMemoryGenerationJobsRepository();
    const notificationsRepository = new InMemoryNotificationsRepository();
    workspaceRoot = await mkdtemp(
      path.join(tmpdir(), 'ai-backend-factory-generation-e2e-'),
    );

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AccountsRepository)
      .useValue(accountsRepository)
      .overrideProvider(GenerationJobsRepository)
      .useValue(jobsRepository)
      .overrideProvider(NotificationsRepository)
      .useValue(notificationsRepository)
      .overrideProvider(WorkspaceRootPathProvider)
      .useValue(new StaticWorkspaceRootPathProvider(workspaceRoot))
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await waitForBackgroundJobsToFinish();
    await app?.close();
    await rm(workspaceRoot, { force: true, recursive: true });
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

  async function waitForTerminalJobState(accessToken: string, jobId: string) {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const response = await request(app.getHttpServer())
        .get(`/generation-jobs/${jobId}`)
        .set('authorization', `Bearer ${accessToken}`);

      if (
        response.body.generationJob.state === 'SUCCEEDED' ||
        response.body.generationJob.state === 'FAILED'
      ) {
        return response;
      }

      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    throw new Error(`Generation job ${jobId} did not reach a terminal state.`);
  }

  async function waitForBackgroundJobsToFinish() {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const hasPendingWork = jobsRepository.items.some(
        (job) =>
          job.state === GenerationJobState.PENDING ||
          job.state === GenerationJobState.RUNNING,
      );

      if (!hasPendingWork) {
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    throw new Error(
      'Background generation jobs did not finish before teardown.',
    );
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

  it('processes a created generation job asynchronously and persists output metadata', async () => {
    const accessToken = await createAccountAndAuthenticate(
      'jobs.process@example.com',
    );

    const createResponse = await request(app.getHttpServer())
      .post('/generation-jobs')
      .set('authorization', `Bearer ${accessToken}`)
      .send({
        projectName: 'Async Ops API',
        projectDescription: 'A generated service for async execution checks',
        notes: 'verify git init and output path persistence',
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.generationJob.state).toBe('PENDING');

    const terminalResponse = await waitForTerminalJobState(
      accessToken,
      createResponse.body.generationJob.id,
    );

    expect(terminalResponse.status).toBe(200);
    expect(terminalResponse.body.generationJob).toMatchObject({
      id: createResponse.body.generationJob.id,
      state: 'SUCCEEDED',
      outputPath: path.join(workspaceRoot, 'async-ops-api'),
      failureReason: null,
    });
    await expect(
      stat(path.join(workspaceRoot, 'async-ops-api', '.git')),
    ).resolves.toBeDefined();
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

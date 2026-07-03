import { execFile } from 'node:child_process';
import { access, mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AccountsRepository } from '@/domain/factory/application/repositories/accounts-repository';
import { GenerationJobsRepository } from '@/domain/factory/application/repositories/generation-jobs-repository';
import { GeneratedServiceWorkflowRunner } from '@/domain/factory/application/services/generated-service-workflow-runner';
import { GenerationJobState } from '@/domain/factory/enterprise/entities/generation-job';
import { NotificationsRepository } from '@/domain/notification/application/repositories/notifications-repository';
import { AppModule } from '@/infra/app.module';
import { WorkspaceRootPathProvider } from '@/infra/filesystem/workspace-root-path-provider';
import { DeterministicGeneratedServiceWorkflowRunner } from '../../../../test/fakes/deterministic-generated-service-workflow-runner';
import { InMemoryAccountsRepository } from '../../../../test/repositories/in-memory-accounts-repository';
import { InMemoryGenerationJobsRepository } from '../../../../test/repositories/in-memory-generation-jobs-repository';
import { InMemoryNotificationsRepository } from '../../../../test/repositories/in-memory-notifications-repository';

const execFileAsync = promisify(execFile);

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
      .overrideProvider(GeneratedServiceWorkflowRunner)
      .useValue(
        new DeterministicGeneratedServiceWorkflowRunner({
          'runner-failure-api':
            'Guarded Codex runner failed for features/runner-failure-api.md.',
        }),
      )
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
      repositoryPath: null,
      featureScopeRelativePath: null,
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
      repositoryPath: path.join(workspaceRoot, 'async-ops-api'),
      featureScopeRelativePath: 'features/async-ops-api.md',
      failureReason: null,
    });
    await expect(
      stat(path.join(workspaceRoot, 'async-ops-api', '.git')),
    ).resolves.toBeDefined();
  });

  it('covers the primary authenticated flow from job creation to generated output verification and notification read', async () => {
    const accessToken = await createAccountAndAuthenticate(
      'jobs.flow@example.com',
    );

    const createResponse = await request(app.getHttpServer())
      .post('/generation-jobs')
      .set('authorization', `Bearer ${accessToken}`)
      .send({
        projectName: 'Platform Core API',
        projectDescription: 'A generated service for flow verification',
        notes: 'verify generated output inventory and notification flow',
      });

    expect(createResponse.status).toBe(201);

    const terminalResponse = await waitForTerminalJobState(
      accessToken,
      createResponse.body.generationJob.id,
    );
    const outputPath = path.join(workspaceRoot, 'platform-core-api');

    expect(terminalResponse.status).toBe(200);
    expect(terminalResponse.body.generationJob).toMatchObject({
      id: createResponse.body.generationJob.id,
      state: 'SUCCEEDED',
      outputPath,
      repositoryPath: outputPath,
      featureScopeRelativePath: 'features/platform-core-api.md',
      failureReason: null,
    });

    await Promise.all(
      [
        'AGENTS.md',
        '.github/workflows/ci.yml',
        'CONTEXT.md',
        'PROJECT.md',
        'README.md',
        'WORKFLOW.md',
        'docker-compose.yml',
        'features/platform-core-api.md',
        'package.json',
        'prisma/schema.prisma',
        'src/core/entities/entity.ts',
        'src/domain/generated/enterprise/entities/generated-scope.ts',
        'src/core/errors/use-case-error.ts',
        'src/domain/auth/application/use-cases/authenticate.ts',
        'src/domain/notification/application/use-cases/list-notifications.ts',
        'src/infra/cache/redis/redis.module.ts',
        'src/infra/http/controllers/health.controller.ts',
        'test/e2e/health.e2e-spec.ts',
      ].map(async (artifactPath) => {
        await access(path.join(outputPath, artifactPath));
      }),
    );
    const [contextFile, projectFile, featureScopeFile] = await Promise.all([
      readFile(path.join(outputPath, 'CONTEXT.md'), 'utf8'),
      readFile(path.join(outputPath, 'PROJECT.md'), 'utf8'),
      readFile(path.join(outputPath, 'features/platform-core-api.md'), 'utf8'),
    ]);
    await expect(runGit(['status', '--short'], outputPath)).resolves.toBe('');
    await expect(
      runGit(['rev-list', '--count', 'HEAD'], outputPath),
    ).resolves.toBe('2');
    expect(projectFile).toContain('# Platform Core API');
    expect(projectFile).toContain('A generated service for flow verification');
    expect(projectFile).toContain('features/platform-core-api.md');
    expect(contextFile).toContain('# Platform Core API');
    expect(contextFile).toContain('A generated service for flow verification');
    expect(contextFile).toContain(
      'verify generated output inventory and notification flow',
    );
    expect(featureScopeFile).toContain('Status: done');

    const notificationsResponse = await request(app.getHttpServer())
      .get('/notifications')
      .set('authorization', `Bearer ${accessToken}`);

    expect(notificationsResponse.status).toBe(200);
    expect(notificationsResponse.body.notifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          title: 'Generation completed',
          isRead: false,
        }),
      ]),
    );

    const [notification] = notificationsResponse.body.notifications;

    const readResponse = await request(app.getHttpServer())
      .patch(`/notifications/${notification.id}/read`)
      .set('authorization', `Bearer ${accessToken}`)
      .send();

    expect(readResponse.status).toBe(200);
    expect(readResponse.body.notification).toMatchObject({
      id: notification.id,
      isRead: true,
      readAt: expect.any(String),
    });
  });

  it('marks the generation job as failed when guarded workflow execution fails', async () => {
    const accessToken = await createAccountAndAuthenticate(
      'jobs.runner.failure@example.com',
    );

    const createResponse = await request(app.getHttpServer())
      .post('/generation-jobs')
      .set('authorization', `Bearer ${accessToken}`)
      .send({
        projectName: 'Runner Failure API',
        projectDescription: 'A generated service for runner failure checks',
        notes: 'simulate a guarded workflow execution failure',
      });

    expect(createResponse.status).toBe(201);

    const terminalResponse = await waitForTerminalJobState(
      accessToken,
      createResponse.body.generationJob.id,
    );

    expect(terminalResponse.status).toBe(200);
    expect(terminalResponse.body.generationJob).toMatchObject({
      id: createResponse.body.generationJob.id,
      state: 'FAILED',
      outputPath: null,
      repositoryPath: path.join(workspaceRoot, 'runner-failure-api'),
      featureScopeRelativePath: 'features/runner-failure-api.md',
      failureReason: expect.stringContaining(
        'Guarded Codex runner failed for features/runner-failure-api.md.',
      ),
    });
    await expect(
      stat(path.join(workspaceRoot, 'runner-failure-api')),
    ).resolves.toBeDefined();
    await expect(
      stat(
        path.join(
          workspaceRoot,
          'runner-failure-api',
          'src/domain/generated/enterprise/entities/generated-scope.ts',
        ),
      ),
    ).rejects.toThrow();
    await expect(
      readFile(
        path.join(
          workspaceRoot,
          'runner-failure-api',
          'features/runner-failure-api.md',
        ),
        'utf8',
      ),
    ).resolves.toContain('Status: ready');
    await expect(
      runGit(
        ['rev-list', '--count', 'HEAD'],
        path.join(workspaceRoot, 'runner-failure-api'),
      ),
    ).resolves.toBe('1');
    await expect(
      runGit(
        ['status', '--short'],
        path.join(workspaceRoot, 'runner-failure-api'),
      ),
    ).resolves.toBe('');

    const notificationsResponse = await request(app.getHttpServer())
      .get('/notifications')
      .set('authorization', `Bearer ${accessToken}`);

    expect(notificationsResponse.status).toBe(200);
    expect(notificationsResponse.body.notifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Generation failed',
          content: expect.stringContaining('features/runner-failure-api.md'),
        }),
      ]),
    );
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

async function runGit(args: string[], cwd: string): Promise<string> {
  const { stdout } = await execFileAsync('git', args, {
    cwd,
  });

  return stdout.trim();
}

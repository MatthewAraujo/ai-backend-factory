import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import { DomainEvents } from '@/core/events/domain-events';
import type { GeneratedServiceWorkflowRunner } from '@/domain/factory/application/services/generated-service-workflow-runner';
import { ProcessGenerationJobUseCase } from '@/domain/factory/application/use-cases/process-generation-job';
import { GenerationJobState } from '@/domain/factory/enterprise/entities/generation-job';
import { OnGenerationJobTerminalState } from '@/domain/notification/application/subscribers/on-generation-job-terminal-state';
import { NotificationType } from '@/domain/notification/enterprise/entities/notification';
import { LocalGeneratedServiceGenerator } from '@/infra/filesystem/local-generated-service-generator';
import type { WorkspaceRootPathProvider } from '@/infra/filesystem/workspace-root-path-provider';
import { GitCliProcessRunner } from '@/infra/process/git-cli-process-runner';

import { makeGenerationJob } from '../../../../../test/factories/make-generation-job';
import { InMemoryGenerationJobsRepository } from '../../../../../test/repositories/in-memory-generation-jobs-repository';
import { InMemoryNotificationsRepository } from '../../../../../test/repositories/in-memory-notifications-repository';

const execFileAsync = promisify(execFile);

class StaticWorkspaceRootPathProvider implements WorkspaceRootPathProvider {
  constructor(private readonly workspaceRoot: string) {}

  getPath(): string {
    return this.workspaceRoot;
  }
}

class FakeGeneratedServiceWorkflowRunner
  implements GeneratedServiceWorkflowRunner
{
  constructor(private readonly failWith?: Error) {}

  async run(): Promise<void> {
    if (this.failWith) {
      throw this.failWith;
    }
  }
}

describe('ProcessGenerationJobUseCase', () => {
  let workspaceRoot: string;

  beforeEach(async () => {
    DomainEvents.clearHandlers();
    DomainEvents.clearMarkedAggregates();
    workspaceRoot = await mkdtemp(
      path.join(tmpdir(), 'ai-backend-factory-generation-'),
    );
  });

  afterEach(async () => {
    DomainEvents.clearHandlers();
    DomainEvents.clearMarkedAggregates();
    await rm(workspaceRoot, { force: true, recursive: true });
  });

  it('processes a pending job into a generated git-initialized service and creates a success notification', async () => {
    const jobsRepository = new InMemoryGenerationJobsRepository();
    const notificationsRepository = new InMemoryNotificationsRepository();
    const generator = new LocalGeneratedServiceGenerator(
      new StaticWorkspaceRootPathProvider(workspaceRoot),
      new GitCliProcessRunner(),
      new FakeGeneratedServiceWorkflowRunner(),
    );
    const subscriber = new OnGenerationJobTerminalState(
      notificationsRepository,
    );
    const sut = new ProcessGenerationJobUseCase(jobsRepository, generator);

    subscriber.setupSubscriptions();

    await jobsRepository.create(
      makeGenerationJob({
        id: 'job-1',
        ownerId: 'owner-1',
        projectName: 'Factory CRM',
      }),
    );

    const result = await sut.execute({
      generationJobId: 'job-1',
    });

    expect(result.isRight()).toBe(true);

    const generationJob = await jobsRepository.findById('job-1');

    expect(generationJob?.state).toBe(GenerationJobState.SUCCEEDED);
    expect(generationJob?.startedAt).toEqual(expect.any(Date));
    expect(generationJob?.completedAt).toEqual(expect.any(Date));
    expect(generationJob?.failureReason).toBeNull();
    expect(generationJob?.outputPath).toBe(
      path.join(workspaceRoot, 'factory-crm'),
    );

    await expect(
      stat(path.join(workspaceRoot, 'factory-crm', '.git')),
    ).resolves.toBeDefined();
    await expect(
      stat(path.join(workspaceRoot, 'factory-crm', 'README.md')),
    ).resolves.toBeDefined();
    await Promise.all(
      ['AGENTS.md', 'WORKFLOW.md', 'features/factory-crm.md'].map(
        async (artifactPath) => {
          await stat(path.join(workspaceRoot, 'factory-crm', artifactPath));
        },
      ),
    );

    const gitHead = await readFile(
      path.join(workspaceRoot, 'factory-crm', '.git', 'HEAD'),
      'utf8',
    );
    const [featureScopeFile, gitStatus, gitCommitCount] = await Promise.all([
      readFile(
        path.join(workspaceRoot, 'factory-crm', 'features/factory-crm.md'),
        'utf8',
      ),
      runGit(['status', '--short'], path.join(workspaceRoot, 'factory-crm')),
      runGit(
        ['rev-list', '--count', 'HEAD'],
        path.join(workspaceRoot, 'factory-crm'),
      ),
    ]);

    expect(gitHead).toContain('refs/heads/');
    expect(gitStatus).toBe('');
    expect(gitCommitCount).toBe('1');
    expect(featureScopeFile).toContain('# Factory CRM');
    expect(featureScopeFile).toContain('A deterministic CRM starter');
    expect(featureScopeFile).toContain('Include audit logging later');
    expect(notificationsRepository.items).toHaveLength(1);
    expect(notificationsRepository.items[0]).toMatchObject({
      ownerId: expect.objectContaining({
        toString: expect.any(Function),
      }),
      generationJobId: expect.objectContaining({
        toString: expect.any(Function),
      }),
      type: NotificationType.GENERATION_SUCCEEDED,
      title: 'Generation completed',
      content: 'Factory CRM is ready under the workspace root.',
    });
  });

  it('marks the job as failed when the target project directory already exists and creates a failure notification', async () => {
    const jobsRepository = new InMemoryGenerationJobsRepository();
    const notificationsRepository = new InMemoryNotificationsRepository();
    const generator = new LocalGeneratedServiceGenerator(
      new StaticWorkspaceRootPathProvider(workspaceRoot),
      new GitCliProcessRunner(),
      new FakeGeneratedServiceWorkflowRunner(),
    );
    const subscriber = new OnGenerationJobTerminalState(
      notificationsRepository,
    );
    const sut = new ProcessGenerationJobUseCase(jobsRepository, generator);

    subscriber.setupSubscriptions();

    await mkdir(path.join(workspaceRoot, 'factory-crm'), { recursive: true });
    await jobsRepository.create(
      makeGenerationJob({
        id: 'job-1',
        ownerId: 'owner-1',
        projectName: 'Factory CRM',
      }),
    );

    const result = await sut.execute({
      generationJobId: 'job-1',
    });

    expect(result.isRight()).toBe(true);

    const generationJob = await jobsRepository.findById('job-1');

    expect(generationJob?.state).toBe(GenerationJobState.FAILED);
    expect(generationJob?.outputPath).toBeNull();
    expect(generationJob?.completedAt).toEqual(expect.any(Date));
    expect(generationJob?.failureReason).toContain('already exists');
    expect(await readdir(workspaceRoot)).toEqual(['factory-crm']);
    expect(notificationsRepository.items).toHaveLength(1);
    expect(notificationsRepository.items[0]).toMatchObject({
      type: NotificationType.GENERATION_FAILED,
      title: 'Generation failed',
    });
  });

  it('normalizes unsafe project names into a workspace-root-contained output path', async () => {
    const jobsRepository = new InMemoryGenerationJobsRepository();
    const generator = new LocalGeneratedServiceGenerator(
      new StaticWorkspaceRootPathProvider(workspaceRoot),
      new GitCliProcessRunner(),
      new FakeGeneratedServiceWorkflowRunner(),
    );
    const sut = new ProcessGenerationJobUseCase(jobsRepository, generator);

    await jobsRepository.create(
      makeGenerationJob({
        id: 'job-1',
        ownerId: 'owner-1',
        projectName: '../../Admin API',
      }),
    );

    await sut.execute({
      generationJobId: 'job-1',
    });

    const generationJob = await jobsRepository.findById('job-1');

    expect(generationJob?.state).toBe(GenerationJobState.SUCCEEDED);
    expect(generationJob?.outputPath).toBe(
      path.join(workspaceRoot, 'admin-api'),
    );
    expect(
      path.relative(workspaceRoot, generationJob?.outputPath ?? ''),
    ).not.toMatch(/^\.\./);
  });

  it('marks the job as failed when guarded workflow execution fails after baseline bootstrap', async () => {
    const jobsRepository = new InMemoryGenerationJobsRepository();
    const notificationsRepository = new InMemoryNotificationsRepository();
    const generator = new LocalGeneratedServiceGenerator(
      new StaticWorkspaceRootPathProvider(workspaceRoot),
      new GitCliProcessRunner(),
      new FakeGeneratedServiceWorkflowRunner(
        new Error('Codex runner is unavailable.'),
      ),
    );
    const subscriber = new OnGenerationJobTerminalState(
      notificationsRepository,
    );
    const sut = new ProcessGenerationJobUseCase(jobsRepository, generator);

    subscriber.setupSubscriptions();

    await jobsRepository.create(
      makeGenerationJob({
        id: 'job-1',
        ownerId: 'owner-1',
        projectName: 'Factory CRM',
      }),
    );

    const result = await sut.execute({
      generationJobId: 'job-1',
    });

    expect(result.isRight()).toBe(true);

    const generationJob = await jobsRepository.findById('job-1');

    expect(generationJob?.state).toBe(GenerationJobState.FAILED);
    expect(generationJob?.outputPath).toBeNull();
    expect(generationJob?.failureReason).toContain(
      'Codex runner is unavailable.',
    );
    expect(notificationsRepository.items).toHaveLength(1);
    expect(notificationsRepository.items[0]).toMatchObject({
      type: NotificationType.GENERATION_FAILED,
      title: 'Generation failed',
    });
  });
});

async function runGit(args: string[], cwd: string): Promise<string> {
  const { stdout } = await execFileAsync('git', args, {
    cwd,
  });

  return stdout.trim();
}

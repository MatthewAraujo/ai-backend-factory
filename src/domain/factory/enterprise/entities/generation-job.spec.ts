import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import {
  GenerationJob,
  GenerationJobState,
} from '@/domain/factory/enterprise/entities/generation-job';
import {
  InvalidGenerationJobFailureTransitionError,
  MissingGenerationJobOwnerError,
} from '@/domain/factory/enterprise/errors/generation-job-errors';

describe('GenerationJob', () => {
  it('starts pending and preserves the submitted request metadata', () => {
    const job = GenerationJob.create({
      ownerId: 'owner-1',
      projectName: 'Factory CRM',
      projectDescription: 'A deterministic CRM starter',
      notes: 'Include audit logging later',
    });

    expect(job.id).toBeInstanceOf(UniqueEntityID);
    expect(job.ownerId).toBeInstanceOf(UniqueEntityID);
    expect(job.ownerId.toString()).toBe('owner-1');
    expect(job.projectName).toBe('Factory CRM');
    expect(job.projectDescription).toBe('A deterministic CRM starter');
    expect(job.notes).toBe('Include audit logging later');
    expect(job.state).toBe(GenerationJobState.PENDING);
    expect(job.outputPath).toBeNull();
    expect(job.repositoryPath).toBeNull();
    expect(job.featureScopeRelativePath).toBeNull();
    expect(job.failureReason).toBeNull();
    expect(job.startedAt).toBeNull();
    expect(job.completedAt).toBeNull();
  });

  it('transitions from pending to running to succeeded', () => {
    const job = GenerationJob.create({
      ownerId: 'owner-1',
      projectName: 'Factory CRM',
      projectDescription: 'A deterministic CRM starter',
      notes: 'Include audit logging later',
    });

    job.start(new Date('2026-07-01T21:00:00.000Z'));
    job.succeed(
      '/home/matthew/personal/ai-backend-factory/repos/factory-crm',
      new Date('2026-07-01T21:05:00.000Z'),
      {
        featureScopeRelativePath: 'features/factory-crm.md',
        repositoryPath:
          '/home/matthew/personal/ai-backend-factory/repos/factory-crm',
      },
    );

    expect(job.state).toBe(GenerationJobState.SUCCEEDED);
    expect(job.outputPath).toBe(
      '/home/matthew/personal/ai-backend-factory/repos/factory-crm',
    );
    expect(job.repositoryPath).toBe(
      '/home/matthew/personal/ai-backend-factory/repos/factory-crm',
    );
    expect(job.featureScopeRelativePath).toBe('features/factory-crm.md');
    expect(job.failureReason).toBeNull();
    expect(job.startedAt).toEqual(new Date('2026-07-01T21:00:00.000Z'));
    expect(job.completedAt).toEqual(new Date('2026-07-01T21:05:00.000Z'));
  });

  it('rejects terminal transitions after success', () => {
    const job = GenerationJob.create({
      ownerId: 'owner-1',
      projectName: 'Factory CRM',
      projectDescription: 'A deterministic CRM starter',
      notes: 'Include audit logging later',
    });

    job.start(new Date('2026-07-01T21:00:00.000Z'));
    job.succeed(
      '/home/matthew/personal/ai-backend-factory/repos/factory-crm',
      new Date('2026-07-01T21:05:00.000Z'),
    );

    expect(() =>
      job.fail('Target project folder already exists.'),
    ).toThrowError(InvalidGenerationJobFailureTransitionError);
  });

  it('requires a non-empty owner id', () => {
    expect(() =>
      GenerationJob.create({
        ownerId: '   ',
        projectName: 'Factory CRM',
        projectDescription: 'A deterministic CRM starter',
        notes: 'Include audit logging later',
      }),
    ).toThrowError(MissingGenerationJobOwnerError);
  });
});

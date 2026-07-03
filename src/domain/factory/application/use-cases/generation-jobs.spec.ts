import { CreateGenerationJobUseCase } from '@/domain/factory/application/use-cases/create-generation-job';
import { ResourceNotFoundError } from '@/domain/factory/application/use-cases/errors/resource-not-found-error';
import { GetGenerationJobDetailsUseCase } from '@/domain/factory/application/use-cases/get-generation-job-details';
import { ListUserGenerationJobsUseCase } from '@/domain/factory/application/use-cases/list-user-generation-jobs';
import { GenerationJobState } from '@/domain/factory/enterprise/entities/generation-job';

import { makeGenerationJob } from '../../../../../test/factories/make-generation-job';
import { InMemoryGenerationJobsRepository } from '../../../../../test/repositories/in-memory-generation-jobs-repository';

describe('Generation job use cases', () => {
  it('creates a pending generation job for the authenticated owner', async () => {
    const jobsRepository = new InMemoryGenerationJobsRepository();
    const sut = new CreateGenerationJobUseCase(jobsRepository);

    const result = await sut.execute({
      ownerId: 'owner-1',
      projectName: '  Factory CRM  ',
      projectDescription: '  A deterministic CRM starter  ',
      notes: '  Include audit logging later  ',
    });

    expect(result.isRight()).toBe(true);
    expect(result.value).toMatchObject({
      generationJob: {
        ownerId: expect.objectContaining({
          toString: expect.any(Function),
        }),
        projectName: 'Factory CRM',
        projectDescription: 'A deterministic CRM starter',
        notes: 'Include audit logging later',
        state: GenerationJobState.PENDING,
        outputPath: null,
        failureReason: null,
      },
    });
    expect(jobsRepository.items).toHaveLength(1);
  });

  it('lists only generation jobs owned by the requested account in reverse chronological order', async () => {
    const jobsRepository = new InMemoryGenerationJobsRepository();
    const sut = new ListUserGenerationJobsUseCase(jobsRepository);

    await jobsRepository.create(
      makeGenerationJob({
        id: 'job-1',
        ownerId: 'owner-1',
        projectName: 'Older job',
        createdAt: new Date('2026-07-02T10:00:00.000Z'),
      }),
    );
    await jobsRepository.create(
      makeGenerationJob({
        id: 'job-2',
        ownerId: 'owner-1',
        projectName: 'Newer job',
        createdAt: new Date('2026-07-02T10:05:00.000Z'),
      }),
    );
    await jobsRepository.create(
      makeGenerationJob({
        id: 'job-3',
        ownerId: 'owner-2',
        projectName: 'Foreign job',
        createdAt: new Date('2026-07-02T10:10:00.000Z'),
      }),
    );

    const result = await sut.execute({
      ownerId: 'owner-1',
    });

    expect(result.isRight()).toBe(true);
    expect(result.value.generationJobs.map((job) => job.id.toString())).toEqual(
      ['job-2', 'job-1'],
    );
  });

  it('rejects reading generation job details for a different owner', async () => {
    const jobsRepository = new InMemoryGenerationJobsRepository();
    const sut = new GetGenerationJobDetailsUseCase(jobsRepository);

    await jobsRepository.create(
      makeGenerationJob({
        id: 'job-1',
        ownerId: 'owner-1',
      }),
    );

    const result = await sut.execute({
      ownerId: 'owner-2',
      generationJobId: 'job-1',
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });
});

import type {
  GenerationJob as PrismaGenerationJob,
  GenerationJobState as PrismaGenerationJobState,
} from '@prisma/client';

import {
  GenerationJob,
  type GenerationJobState,
} from '@/domain/factory/enterprise/entities/generation-job';

export function toDomainGenerationJob(raw: PrismaGenerationJob): GenerationJob {
  return GenerationJob.create({
    id: raw.id,
    ownerId: raw.ownerId,
    projectName: raw.projectName,
    projectDescription: raw.projectDescription,
    notes: raw.notes,
    state: raw.state as GenerationJobState,
    outputPath: raw.outputPath,
    failureReason: raw.failureReason,
    startedAt: raw.startedAt,
    completedAt: raw.completedAt,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  });
}

export function toPrismaGenerationJob(job: GenerationJob): PrismaGenerationJob {
  return {
    id: job.id,
    ownerId: job.ownerId,
    projectName: job.projectName,
    projectDescription: job.projectDescription,
    notes: job.notes,
    state: job.state as PrismaGenerationJobState,
    outputPath: job.outputPath,
    failureReason: job.failureReason,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

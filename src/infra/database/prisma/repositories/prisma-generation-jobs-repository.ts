import { Injectable } from '@nestjs/common';
import type { GenerationJob as PrismaGenerationJob } from '@prisma/client';

import { DomainEvents } from '@/core/events/domain-events';
import type { GenerationJobsRepository } from '@/domain/factory/application/repositories/generation-jobs-repository';
import type { GenerationJob } from '@/domain/factory/enterprise/entities/generation-job';
import {
  toDomainGenerationJob,
  toPrismaGenerationJob,
} from '@/infra/database/prisma/mappers/prisma-generation-job-mapper';

type PrismaGenerationJobsClient = {
  generationJob: {
    create(args: { data: PrismaGenerationJob }): Promise<PrismaGenerationJob>;
    update(args: {
      data: PrismaGenerationJob;
      where: { id: string };
    }): Promise<PrismaGenerationJob>;
    findUnique(args: {
      where: { id: string };
    }): Promise<PrismaGenerationJob | null>;
    findMany(args: {
      orderBy: { createdAt: 'desc' };
      where: { ownerId: string };
    }): Promise<PrismaGenerationJob[]>;
  };
};

@Injectable()
export class PrismaGenerationJobsRepository
  implements GenerationJobsRepository
{
  constructor(private readonly prisma: PrismaGenerationJobsClient) {}

  async create(job: GenerationJob): Promise<void> {
    await this.prisma.generationJob.create({
      data: toPrismaGenerationJob(job),
    });
    await DomainEvents.dispatchEventsForAggregate(job.id);
  }

  async save(job: GenerationJob): Promise<void> {
    await this.prisma.generationJob.update({
      where: {
        id: job.id.toString(),
      },
      data: toPrismaGenerationJob(job),
    });
    await DomainEvents.dispatchEventsForAggregate(job.id);
  }

  async findById(id: string): Promise<GenerationJob | null> {
    const job = await this.prisma.generationJob.findUnique({
      where: {
        id,
      },
    });

    if (!job) {
      return null;
    }

    return toDomainGenerationJob(job);
  }

  async findManyByOwnerId(ownerId: string): Promise<GenerationJob[]> {
    const jobs = await this.prisma.generationJob.findMany({
      where: {
        ownerId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return jobs.map(toDomainGenerationJob);
  }
}

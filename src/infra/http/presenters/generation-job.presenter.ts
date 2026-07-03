import type { GenerationJob } from '@/domain/factory/enterprise/entities/generation-job';

export function presentGenerationJob(generationJob: GenerationJob) {
  return {
    id: generationJob.id.toString(),
    ownerId: generationJob.ownerId.toString(),
    projectName: generationJob.projectName,
    projectDescription: generationJob.projectDescription,
    notes: generationJob.notes,
    state: generationJob.state,
    outputPath: generationJob.outputPath,
    failureReason: generationJob.failureReason,
    startedAt: generationJob.startedAt,
    completedAt: generationJob.completedAt,
    createdAt: generationJob.createdAt,
    updatedAt: generationJob.updatedAt,
  };
}

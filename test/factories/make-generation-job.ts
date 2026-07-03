import {
  GenerationJob,
  type GenerationJobState,
} from '@/domain/factory/enterprise/entities/generation-job';

type MakeGenerationJobOverrides = Partial<{
  completedAt: Date | null;
  createdAt: Date;
  failureReason: string | null;
  featureScopeRelativePath: string | null;
  id: string;
  notes: string;
  outputPath: string | null;
  ownerId: string;
  projectDescription: string;
  projectName: string;
  repositoryPath: string | null;
  startedAt: Date | null;
  state: GenerationJobState;
  updatedAt: Date;
}>;

export function makeGenerationJob(
  overrides: MakeGenerationJobOverrides = {},
): GenerationJob {
  return GenerationJob.create(
    {
      ownerId: overrides.ownerId ?? 'owner-1',
      projectName: overrides.projectName ?? 'Factory CRM',
      projectDescription:
        overrides.projectDescription ?? 'A deterministic CRM starter',
      notes: overrides.notes ?? 'Include audit logging later',
      state: overrides.state,
      outputPath: overrides.outputPath,
      repositoryPath: overrides.repositoryPath,
      featureScopeRelativePath: overrides.featureScopeRelativePath,
      failureReason: overrides.failureReason,
      startedAt: overrides.startedAt,
      completedAt: overrides.completedAt,
      createdAt: overrides.createdAt,
      updatedAt: overrides.updatedAt,
    },
    overrides.id,
  );
}

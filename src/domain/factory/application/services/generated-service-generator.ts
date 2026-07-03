import type { GenerationJob } from '@/domain/factory/enterprise/entities/generation-job';

export type GeneratedServiceMetadata = {
  featureScopeRelativePath: string | null;
  repositoryPath: string | null;
};

export type GeneratedServiceResult = {
  featureScopeRelativePath: string | null;
  outputPath: string;
  repositoryPath: string | null;
};

export class GeneratedServiceGenerationError extends Error {
  readonly featureScopeRelativePath: string | null;
  readonly repositoryPath: string | null;

  constructor(message: string, metadata: GeneratedServiceMetadata) {
    super(message);
    this.name = 'GeneratedServiceGenerationError';
    this.featureScopeRelativePath = metadata.featureScopeRelativePath;
    this.repositoryPath = metadata.repositoryPath;
  }
}

export abstract class GeneratedServiceGenerator {
  abstract generate(params: {
    generationJob: GenerationJob;
  }): Promise<GeneratedServiceResult>;
}

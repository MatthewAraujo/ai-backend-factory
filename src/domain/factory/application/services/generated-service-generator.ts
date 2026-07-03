import type { GenerationJob } from '@/domain/factory/enterprise/entities/generation-job';

export type GeneratedServiceResult = {
  outputPath: string;
};

export abstract class GeneratedServiceGenerator {
  abstract generate(params: {
    generationJob: GenerationJob;
  }): Promise<GeneratedServiceResult>;
}

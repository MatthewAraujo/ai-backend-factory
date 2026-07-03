import { access, cp, mkdir, mkdtemp, rename, rm } from 'node:fs/promises';
import path from 'node:path';

import { Inject, Injectable } from '@nestjs/common';

import { getGeneratedServiceTemplateManifest } from '@/domain/factory/application/generation/generated-service-template-manifest';
import type {
  GeneratedServiceGenerator,
  GeneratedServiceResult,
} from '@/domain/factory/application/services/generated-service-generator';
import type { GenerationJob } from '@/domain/factory/enterprise/entities/generation-job';
import { WorkspaceRootPathProvider } from '@/infra/filesystem/workspace-root-path-provider';
import { GitProcessRunner } from '@/infra/process/git-process-runner';

@Injectable()
export class LocalGeneratedServiceGenerator
  implements GeneratedServiceGenerator
{
  constructor(
    @Inject(WorkspaceRootPathProvider)
    private readonly workspaceRootPathProvider: WorkspaceRootPathProvider,
    @Inject(GitProcessRunner)
    private readonly gitProcessRunner: GitProcessRunner,
  ) {}

  async generate(params: {
    generationJob: GenerationJob;
  }): Promise<GeneratedServiceResult> {
    const workspaceRoot = path.resolve(
      this.workspaceRootPathProvider.getPath(),
    );
    const projectSlug = normalizeProjectSlug(params.generationJob.projectName);
    const outputPath = path.resolve(workspaceRoot, projectSlug);
    const relativeOutputPath = path.relative(workspaceRoot, outputPath);

    if (
      relativeOutputPath.length === 0 ||
      relativeOutputPath.startsWith('..') ||
      path.isAbsolute(relativeOutputPath)
    ) {
      throw new Error('Generated service path escaped the workspace root.');
    }

    await mkdir(workspaceRoot, { recursive: true });

    if (await pathExists(outputPath)) {
      throw new Error(
        `Generated service directory already exists at ${outputPath}.`,
      );
    }

    const { templateRoot } = getGeneratedServiceTemplateManifest();
    const stagingRoot = await mkdtemp(
      path.join(workspaceRoot, `.tmp-${projectSlug}-`),
    );

    try {
      await cp(templateRoot, stagingRoot, {
        recursive: true,
      });
      await this.gitProcessRunner.initRepository(stagingRoot);
      await rename(stagingRoot, outputPath);

      return {
        outputPath,
      };
    } catch (error) {
      await rm(stagingRoot, { force: true, recursive: true });
      throw error;
    }
  }
}

function normalizeProjectSlug(projectName: string): string {
  const slug = projectName
    .normalize('NFKD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '');

  if (slug.length === 0) {
    throw new Error(
      'Project name could not be normalized into a safe workspace directory.',
    );
  }

  return slug;
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

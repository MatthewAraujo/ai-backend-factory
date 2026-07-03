import {
  access,
  cp,
  mkdir,
  mkdtemp,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';

import { Inject, Injectable } from '@nestjs/common';

import { getGeneratedServiceTemplateManifest } from '@/domain/factory/application/generation/generated-service-template-manifest';
import {
  GeneratedServiceGenerationError,
  type GeneratedServiceGenerator,
  type GeneratedServiceMetadata,
  type GeneratedServiceResult,
} from '@/domain/factory/application/services/generated-service-generator';
import { GeneratedServiceWorkflowRunner } from '@/domain/factory/application/services/generated-service-workflow-runner';
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
    @Inject(GeneratedServiceWorkflowRunner)
    private readonly generatedServiceWorkflowRunner: GeneratedServiceWorkflowRunner,
  ) {}

  async generate(params: {
    generationJob: GenerationJob;
  }): Promise<GeneratedServiceResult> {
    const workspaceRoot = path.resolve(
      this.workspaceRootPathProvider.getPath(),
    );
    const projectSlug = normalizeProjectSlug(params.generationJob.projectName);
    const featureFileRelativePath = `features/${projectSlug}.md`;
    const outputPath = path.resolve(workspaceRoot, projectSlug);
    const generationMetadata = {
      repositoryPath: outputPath,
      featureScopeRelativePath: featureFileRelativePath,
    } satisfies GeneratedServiceMetadata;
    const relativeOutputPath = path.relative(workspaceRoot, outputPath);

    if (
      relativeOutputPath.length === 0 ||
      relativeOutputPath.startsWith('..') ||
      path.isAbsolute(relativeOutputPath)
    ) {
      throw new GeneratedServiceGenerationError(
        'Generated service path escaped the workspace root.',
        generationMetadata,
      );
    }

    await mkdir(workspaceRoot, { recursive: true });

    if (await pathExists(outputPath)) {
      throw new GeneratedServiceGenerationError(
        `Generated service directory already exists at ${outputPath}.`,
        generationMetadata,
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
      await writeGeneratedWorkspaceFiles(stagingRoot, params.generationJob);
      await this.gitProcessRunner.initRepository(stagingRoot);
      await this.gitProcessRunner.createInitialCommit(
        stagingRoot,
        'Bootstrap generated service baseline',
      );
      await rename(stagingRoot, outputPath);
      await this.generatedServiceWorkflowRunner.run({
        featureFileRelativePath,
        repositoryPath: outputPath,
      });

      return {
        featureScopeRelativePath: featureFileRelativePath,
        outputPath,
        repositoryPath: outputPath,
      };
    } catch (error) {
      await rm(stagingRoot, { force: true, recursive: true });
      throw toGeneratedServiceGenerationError(error, generationMetadata);
    }
  }
}

async function writeGeneratedWorkspaceFiles(
  repositoryRoot: string,
  generationJob: GenerationJob,
): Promise<void> {
  const projectSlug = normalizeProjectSlug(generationJob.projectName);
  const featureFileRelativePath = `features/${projectSlug}.md`;

  await Promise.all([
    writeFile(
      path.join(repositoryRoot, 'AGENTS.md'),
      renderAgentsFile(featureFileRelativePath),
      'utf8',
    ),
    writeFile(
      path.join(repositoryRoot, 'WORKFLOW.md'),
      renderWorkflowFile(),
      'utf8',
    ),
    writeFile(
      path.join(repositoryRoot, 'PROJECT.md'),
      renderProjectFile({
        featureFileRelativePath,
        projectDescription: generationJob.projectDescription,
        projectName: generationJob.projectName,
        projectSlug,
      }),
      'utf8',
    ),
    writeFile(
      path.join(repositoryRoot, 'README.md'),
      renderReadmeFile({
        featureFileRelativePath,
        projectDescription: generationJob.projectDescription,
        projectName: generationJob.projectName,
      }),
      'utf8',
    ),
    writeFile(
      path.join(repositoryRoot, 'package.json'),
      renderPackageJsonFile({
        projectDescription: generationJob.projectDescription,
        projectSlug,
      }),
      'utf8',
    ),
  ]);

  await mkdir(path.join(repositoryRoot, 'features'), {
    recursive: true,
  });
  await writeFile(
    path.join(repositoryRoot, featureFileRelativePath),
    renderFeatureScopeFile({
      featureFileRelativePath,
      notes: generationJob.notes,
      projectDescription: generationJob.projectDescription,
      projectName: generationJob.projectName,
    }),
    'utf8',
  );
}

function renderAgentsFile(featureFileRelativePath: string): string {
  return `# Generated Service Instructions

## Working Rules

- Read \`PROJECT.md\` first for repository context.
- Read \`CONTEXT.md\` when it exists and the selected task needs domain vocabulary or prior decisions.
- Treat \`${featureFileRelativePath}\` as the active implementation scope for guarded Codex runs.
- Use test-driven development and complete one ready internal task at a time.
- Keep repository documentation and code comments in English.
- Prefer changes that preserve the forum-inspired modular monolith structure and the shared DDD-lite core primitives.
`;
}

function renderWorkflowFile(): string {
  return `# Generated Service Workflow

## Existing Scoped Work

When a generated feature scope already exists, follow:

\`PROJECT.md -> CONTEXT.md -> selected features/<slug>.md -> tdd\`

Execute exactly one ready internal task per guarded run and update the selected feature scope file before stopping.

## New Work

For new features or refactors beyond the generated starting scope, follow:

\`PROJECT.md -> CONTEXT.md -> grill-with-docs -> to-prd -> task-planner -> features/<slug>.md -> tdd\`
`;
}

function renderProjectFile(params: {
  featureFileRelativePath: string;
  projectDescription: string;
  projectName: string;
  projectSlug: string;
}): string {
  return `# ${params.projectName}

## Overview

${params.projectDescription}

This generated backend was bootstrapped by AI Backend Factory. The current generated implementation scope lives in \`${params.featureFileRelativePath}\`.

## Repository Layout

\`\`\`text
features/             Active implementation scope for guarded Codex runs
prisma/               Database schema and future migrations
src/core/             Shared low-level primitives
src/domain/           Domain and application code
src/infra/            Framework and infrastructure adapters
test/                 Integration and end-to-end tests
\`\`\`

## Working Conventions

- Package name: \`${params.projectSlug}\`
- Keep the generated-repository feature scope current as tasks are completed.
- Preserve the forum-inspired modular monolith structure when deepening the backend.
`;
}

function renderReadmeFile(params: {
  featureFileRelativePath: string;
  projectDescription: string;
  projectName: string;
}): string {
  return `# ${params.projectName}

${params.projectDescription}

Generated by AI Backend Factory.

Active implementation scope: \`${params.featureFileRelativePath}\`.
`;
}

function renderPackageJsonFile(params: {
  projectDescription: string;
  projectSlug: string;
}): string {
  return `${JSON.stringify(
    {
      name: params.projectSlug,
      private: true,
      description: params.projectDescription,
    },
    null,
    2,
  )}
`;
}

function renderFeatureScopeFile(params: {
  featureFileRelativePath: string;
  notes: string;
  projectDescription: string;
  projectName: string;
}): string {
  return `# ${params.projectName}

Status: ready

## Summary

Generate the first working backend slice for ${params.projectName} based on the submitted product brief.

## Product Brief

- Project description: ${params.projectDescription}
- Notes: ${params.notes}

## Validation

- \`pnpm lint\`
- \`pnpm typecheck\`
- \`pnpm test\`
- \`pnpm test:e2e\`

## T1 — Model the core domain and persistence

Status: ready

Define the primary business language, aggregate root, supporting entities or value objects, and persistence model needed to satisfy the product brief.

## T2 — Implement the application and HTTP slice

Status: ready

Add the use cases, controllers, presenters, and repository adapters needed to make the generated backend behavior work end-to-end.

## T3 — Validate and document the generated backend

Status: ready

Expand tests, tighten repository docs, and leave the generated repo in a state where the initial feature scope can be marked done.
`;
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

function toGeneratedServiceGenerationError(
  error: unknown,
  metadata: GeneratedServiceMetadata,
): GeneratedServiceGenerationError {
  if (error instanceof GeneratedServiceGenerationError) {
    return error;
  }

  if (error instanceof Error) {
    return new GeneratedServiceGenerationError(error.message, metadata);
  }

  return new GeneratedServiceGenerationError(
    'Generation failed unexpectedly.',
    metadata,
  );
}

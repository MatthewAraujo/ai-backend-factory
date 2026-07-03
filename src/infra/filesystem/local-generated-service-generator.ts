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
  const generatedPrd = renderGeneratedPrdFile({
    featureFileRelativePath,
    notes: generationJob.notes,
    projectDescription: generationJob.projectDescription,
    projectName: generationJob.projectName,
  });

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
      path.join(repositoryRoot, 'CONTEXT.md'),
      renderContextFile({
        notes: generationJob.notes,
        projectDescription: generationJob.projectDescription,
        projectName: generationJob.projectName,
      }),
      'utf8',
    ),
    writeFile(
      path.join(repositoryRoot, 'README.md'),
      renderReadmeFile({
        featureFileRelativePath,
        notes: generationJob.notes,
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
  await mkdir(path.join(repositoryRoot, 'docs'), {
    recursive: true,
  });
  await writeFile(
    path.join(repositoryRoot, 'docs/PRD.md'),
    generatedPrd,
    'utf8',
  );
  await writeFile(
    path.join(repositoryRoot, featureFileRelativePath),
    renderFeatureScopeFile({
      featureFileRelativePath,
      generatedPrd,
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

\`PROJECT.md -> CONTEXT.md -> docs/PRD.md -> selected features/<slug>.md -> tdd\`

Execute exactly one ready internal task per guarded run and update the selected feature scope file before stopping.

## New Work

For new features or refactors beyond the generated starting scope, follow:

\`PROJECT.md -> CONTEXT.md -> grill-with-docs -> to-prd -> task-planner -> docs/PRD.md -> features/<slug>.md -> tdd\`
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

## Delivery Contract

- This repository is continuation-ready, not a claimed final backend.
- The initial generated goal is a serious first implementation that can be extended safely by later guarded Codex runs or by a human team.
- Request-specific vocabulary, assumptions, and workflow notes belong in \`CONTEXT.md\`.

## Repository Layout

\`\`\`text
docs/                 Planning artifacts and durable product requirements
features/             Active implementation scope for guarded Codex runs
prisma/               Database schema and future migrations
src/core/             Shared low-level primitives
src/domain/           Domain and application code
src/infra/            Framework and infrastructure adapters
test/                 Integration and end-to-end tests
\`\`\`

## Working Conventions

- Package name: \`${params.projectSlug}\`
- Treat \`PROJECT.md -> CONTEXT.md -> docs/PRD.md -> ${params.featureFileRelativePath}\` as the implementation document order when those files exist.
- Keep the generated-repository feature scope current as tasks are completed.
- Preserve the forum-inspired modular monolith structure when deepening the backend.
`;
}

function renderReadmeFile(params: {
  featureFileRelativePath: string;
  notes: string;
  projectDescription: string;
  projectName: string;
}): string {
  return `# ${params.projectName}

${params.projectDescription}

Generated by AI Backend Factory.

## Continuation-Ready Starting Point

This repository starts from a baseline backend plus generated project memory so implementation can continue without rediscovering the product from scratch.

## Request Notes

${params.notes}

Active implementation scope: \`${params.featureFileRelativePath}\`.
`;
}

function renderContextFile(params: {
  notes: string;
  projectDescription: string;
  projectName: string;
}): string {
  return `# ${params.projectName}

## Product Context

- Product brief: ${params.projectDescription}
- Request notes: ${params.notes}
- Delivery goal: a continuation-ready backend that captures the requested product direction before deeper implementation begins

## Suggested Domain Focus

- Start from the smallest backend slice that proves the core workflow implied by the brief.
- Keep domain language aligned with the project name and product brief instead of falling back to generic sample terminology.
- Treat the request notes as implementation-shaping constraints, not as optional metadata.

## Assumptions

- The first generated slice should optimize for safe continuation over feature completeness.
- Recommended defaults may be used where the brief is underspecified, but they should be written down in repository docs instead of hidden in prompts.
- The initial implementation should preserve the forum-inspired modular monolith structure and shared DDD-lite primitives.
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

function renderGeneratedPrdFile(params: {
  featureFileRelativePath: string;
  notes: string;
  projectDescription: string;
  projectName: string;
}): string {
  return `# Product Requirements Document

## Problem Statement

${params.projectName} needs a continuation-ready backend that reflects the submitted request instead of only a generic starter. The generated repository should give the next implementation step enough domain context, requirements, assumptions, and validation guidance to build safely without rediscovering the product from scratch.

## Solution

Generate a serious first backend for ${params.projectName} using the opinionated baseline and a single request-shaped implementation scope. The repository should preserve the modular monolith structure, start from generated project memory, and prioritize the smallest backend slice that proves the product workflow implied by the brief.

## User Stories

1. As a product team, we want a backend for ${params.projectName}, so that we can implement ${params.projectDescription.toLowerCase()}.
2. As a maintainer, we want the generated repository to capture request-specific notes such as "${params.notes}", so that follow-up implementation decisions stay aligned with the original brief.
3. As a future contributor, we want a repo-local PRD and feature scope before deeper implementation starts, so that we can continue safely with explicit requirements and validation expectations.

## Implementation Decisions

- Use the generated repository baseline stack and preserve the forum-inspired modular monolith structure.
- Keep the first generated scope focused on one bounded context or workflow slice that best represents ${params.projectName}.
- Treat the request notes as implementation-shaping constraints, not optional metadata.
- Prefer recommended defaults when the brief leaves details open, and record those defaults as assumptions in repository docs.
- Use \`${params.featureFileRelativePath}\` as the active execution plan for guarded or manual continuation work.

## Acceptance Criteria

1. The backend vocabulary, entities, routes, and persistence plan reflect ${params.projectName} and the brief "${params.projectDescription}" instead of placeholder sample terminology.
2. The generated implementation plan explicitly accounts for the request note "${params.notes}".
3. The first backend slice includes domain logic, persistence, an application/use-case layer, HTTP endpoints, and automated tests.
4. The repository remains continuation-ready with project memory, this PRD, and an execution-ready feature scope before deeper implementation begins.

## Testing Decisions

- Prefer unit tests for domain rules and decision logic derived from the brief.
- Prefer integration tests for persistence, use-case orchestration, and module boundaries in the generated slice.
- Keep at least one end-to-end test for the primary HTTP workflow introduced by the first generated scope.

## Out of Scope

- Completing the entire product backend in one pass.
- Adding multiple unrelated feature scopes during initial generation.
- Replacing the baseline stack or the modular monolith structure.

## Validation Plan

- \`pnpm lint\`
- \`pnpm typecheck\`
- \`pnpm test\`
- \`pnpm test:e2e\`

## Further Notes

- Active implementation scope: \`${params.featureFileRelativePath}\`
- Source brief: ${params.projectDescription}
- Source notes: ${params.notes}
`;
}

function renderFeatureScopeFile(params: {
  featureFileRelativePath: string;
  generatedPrd: string;
  notes: string;
  projectDescription: string;
  projectName: string;
}): string {
  const prdAcceptanceCriteria = extractSection(
    params.generatedPrd,
    '## Acceptance Criteria',
    '## Testing Decisions',
  );

  return `# ${params.projectName}

Status: ready

## Summary

Implement the first continuation-ready backend slice for ${params.projectName} using the generated repository PRD and request notes as the execution baseline.

## Product Brief

- Project description: ${params.projectDescription}
- Notes: ${params.notes}

## Source Context

- Requirements: \`docs/PRD.md\`
- Project memory: \`PROJECT.md\`, \`CONTEXT.md\`
- Active scope file: \`${params.featureFileRelativePath}\`

## Acceptance Criteria Mapping

${prdAcceptanceCriteria}

## Validation

- \`pnpm lint\`
- \`pnpm typecheck\`
- \`pnpm test\`
- \`pnpm test:e2e\`

## T1 — Shape the domain slice and persistence model

Status: ready

Objective:
Define the request-shaped bounded context, aggregate root, supporting entities or value objects, and persistence model needed to satisfy the primary workflow implied by the brief.

Implementation notes:

- Start from the smallest serious domain slice that proves the core workflow for ${params.projectName}.
- Use terminology taken from the brief instead of generic sample names.
- Make sure the model leaves room for the constraint "${params.notes}".

Validation focus:

- Unit tests for domain rules and value objects.
- Integration coverage for persistence mapping.

## T2 — Implement the application and HTTP workflow

Status: ready

Objective:
Add the use cases, controllers, presenters, and repository adapters needed to make the chosen backend workflow work end-to-end.

Implementation notes:

- Expose one primary HTTP flow that demonstrates the generated domain slice.
- Keep controller behavior thin and map application errors explicitly.
- Make "${params.notes}" observable in the application behavior or validation rules where relevant.

Validation focus:

- Integration tests for use-case orchestration.
- End-to-end coverage for the primary route flow.

## T3 — Validate and finalize continuation readiness

Status: ready

Objective:
Tighten tests, reconcile repository docs with the implemented slice, and leave the generated repository safe for follow-up guarded or human continuation work.

Implementation notes:

- Update repository docs when implementation choices materially refine the assumptions from \`docs/PRD.md\`.
- Ensure validation commands pass for the generated slice.
- Mark the scope done only after the generated backend, tests, and docs are coherent.

Validation focus:

- Full targeted validation for the generated slice.
- Final documentation sanity check against the original brief and notes.
`;
}

function extractSection(
  document: string,
  startHeading: string,
  endHeading: string,
): string {
  const startIndex = document.indexOf(startHeading);
  const endIndex = document.indexOf(endHeading);

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    return '- Acceptance criteria unavailable';
  }

  return document.slice(startIndex + startHeading.length, endIndex).trim();
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

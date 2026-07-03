import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

import { Injectable } from '@nestjs/common';

import type { GeneratedServiceWorkflowRunner } from '@/domain/factory/application/services/generated-service-workflow-runner';

const execFileAsync = promisify(execFile);
const GUARDED_RUNNER_PATH =
  '/home/matthew/personal/skills/orchestration/run-task-loop-guarded.sh';
const MAX_GUARDED_ITERATIONS = 25;

@Injectable()
export class OrchestrationGeneratedServiceWorkflowRunner
  implements GeneratedServiceWorkflowRunner
{
  async run(params: {
    featureFileRelativePath: string;
    repositoryPath: string;
  }): Promise<void> {
    let previousFeatureFileContent = '';

    for (
      let iteration = 0;
      iteration < MAX_GUARDED_ITERATIONS;
      iteration += 1
    ) {
      const featureFilePath = path.join(
        params.repositoryPath,
        params.featureFileRelativePath,
      );
      const featureFileContent = await readFile(featureFilePath, 'utf8');

      if (!hasReadyInternalTask(featureFileContent)) {
        return;
      }

      await this.runGuardedIteration(params);

      const updatedFeatureFileContent = await readFile(featureFilePath, 'utf8');

      if (
        updatedFeatureFileContent === featureFileContent &&
        updatedFeatureFileContent === previousFeatureFileContent
      ) {
        throw new Error(
          'Guarded Codex runner completed without advancing the generated feature scope.',
        );
      }

      previousFeatureFileContent = updatedFeatureFileContent;
    }

    throw new Error(
      `Guarded Codex runner exceeded ${MAX_GUARDED_ITERATIONS} iterations without completing the generated feature scope.`,
    );
  }

  private async runGuardedIteration(params: {
    featureFileRelativePath: string;
    repositoryPath: string;
  }): Promise<void> {
    try {
      await execFileAsync(
        'bash',
        [
          GUARDED_RUNNER_PATH,
          '--feature',
          params.featureFileRelativePath,
          '--max-tasks',
          '1',
        ],
        {
          cwd: params.repositoryPath,
          env: {
            ...process.env,
            GUARD_NETWORK_MODE: process.env.GUARD_NETWORK_MODE ?? 'bridge',
          },
        },
      );
    } catch (error) {
      throw new Error(resolveRunnerFailureReason(error));
    }
  }
}

function hasReadyInternalTask(featureScopeFileContent: string): boolean {
  const lines = featureScopeFileContent.split(/\r?\n/);
  let insideTask = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line.startsWith('## ')) {
      insideTask = true;
      continue;
    }

    if (!insideTask) {
      continue;
    }

    if (/^Status:\s*ready$/i.test(line)) {
      return true;
    }
  }

  return false;
}

function resolveRunnerFailureReason(error: unknown): string {
  if (error instanceof Error) {
    const details = [
      error.message.trim(),
      readCommandOutput(error, 'stdout'),
      readCommandOutput(error, 'stderr'),
    ]
      .filter((part) => part.length > 0)
      .join(' ')
      .trim();

    if (details.length > 0) {
      return details;
    }
  }

  return 'Guarded Codex runner failed unexpectedly.';
}

function readCommandOutput(error: Error, stream: 'stdout' | 'stderr'): string {
  const value = Reflect.get(error, stream);

  return typeof value === 'string' ? value.trim() : '';
}

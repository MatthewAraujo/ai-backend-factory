import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

import type { GeneratedServiceWorkflowRunner } from '@/domain/factory/application/services/generated-service-workflow-runner';

type FailureMessagesByRepositorySlug = Record<string, string>;
const execFileAsync = promisify(execFile);

export class DeterministicGeneratedServiceWorkflowRunner
  implements GeneratedServiceWorkflowRunner
{
  constructor(
    private readonly failureMessagesByRepositorySlug: FailureMessagesByRepositorySlug = {},
  ) {}

  async run(params: {
    featureFileRelativePath: string;
    repositoryPath: string;
  }): Promise<void> {
    const repositorySlug = path.basename(params.repositoryPath);
    const failureMessage = this.failureMessagesByRepositorySlug[repositorySlug];

    if (failureMessage) {
      throw new Error(failureMessage);
    }

    await Promise.all([
      writeGeneratedDomainArtifact(params.repositoryPath),
      markFeatureScopeDone(
        path.join(params.repositoryPath, params.featureFileRelativePath),
      ),
    ]);
    await commitGeneratedChanges(params.repositoryPath);
  }
}

async function writeGeneratedDomainArtifact(
  repositoryPath: string,
): Promise<void> {
  const generatedArtifactPath = path.join(
    repositoryPath,
    'src/domain/generated/enterprise/entities/generated-scope.ts',
  );

  await mkdir(path.dirname(generatedArtifactPath), { recursive: true });
  await writeFile(
    generatedArtifactPath,
    "export const generatedScope = 'guarded-runner-completed';\n",
    'utf8',
  );
}

async function markFeatureScopeDone(featureScopePath: string): Promise<void> {
  const currentFeatureScope = await readFile(featureScopePath, 'utf8');

  await writeFile(
    featureScopePath,
    currentFeatureScope.replaceAll('Status: ready', 'Status: done'),
    'utf8',
  );
}

async function commitGeneratedChanges(repositoryPath: string): Promise<void> {
  await execFileAsync('git', ['add', '-A'], {
    cwd: repositoryPath,
  });
  await execFileAsync(
    'git',
    [
      '-c',
      'user.name=Guarded Runner',
      '-c',
      'user.email=guarded-runner@example.invalid',
      'commit',
      '--no-gpg-sign',
      '-m',
      'Complete generated scope',
    ],
    {
      cwd: repositoryPath,
    },
  );
}

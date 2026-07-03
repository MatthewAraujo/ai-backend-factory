import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { Injectable } from '@nestjs/common';

import type { GitProcessRunner } from '@/infra/process/git-process-runner';

const execFileAsync = promisify(execFile);

@Injectable()
export class GitCliProcessRunner implements GitProcessRunner {
  async initRepository(directory: string): Promise<void> {
    await execFileAsync('git', ['init'], {
      cwd: directory,
    });
  }

  async createInitialCommit(directory: string, message: string): Promise<void> {
    await execFileAsync('git', ['add', '-A'], {
      cwd: directory,
    });
    await execFileAsync(
      'git',
      [
        '-c',
        'user.name=AI Backend Factory',
        '-c',
        'user.email=generated-service@example.invalid',
        'commit',
        '--no-gpg-sign',
        '-m',
        message,
      ],
      {
        cwd: directory,
      },
    );
  }
}

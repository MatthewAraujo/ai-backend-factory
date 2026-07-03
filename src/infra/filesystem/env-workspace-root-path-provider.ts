import { Inject, Injectable } from '@nestjs/common';

import { EnvService } from '@/infra/env/env.service';
import type { WorkspaceRootPathProvider } from '@/infra/filesystem/workspace-root-path-provider';

@Injectable()
export class EnvWorkspaceRootPathProvider implements WorkspaceRootPathProvider {
  constructor(
    @Inject(EnvService)
    private readonly envService: EnvService,
  ) {}

  getPath(): string {
    return this.envService.workspaceRoot;
  }
}

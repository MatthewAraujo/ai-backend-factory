import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';

import { OnGenerationJobTerminalState } from '@/domain/notification/application/subscribers/on-generation-job-terminal-state';

@Injectable()
export class RegisterDomainEventHandlers implements OnModuleInit {
  constructor(
    @Inject(OnGenerationJobTerminalState)
    private readonly onGenerationJobTerminalState: OnGenerationJobTerminalState,
  ) {}

  onModuleInit(): void {
    this.onGenerationJobTerminalState.setupSubscriptions();
  }
}

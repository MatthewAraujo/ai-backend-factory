import { Inject, Injectable } from '@nestjs/common';

import { DomainEvents } from '@/core/events/domain-events';
import { GenerationJobFailedEvent } from '@/domain/factory/application/events/generation-job-failed-event';
import { GenerationJobSucceededEvent } from '@/domain/factory/application/events/generation-job-succeeded-event';
import { NotificationsRepository } from '@/domain/notification/application/repositories/notifications-repository';
import {
  Notification,
  NotificationType,
} from '@/domain/notification/enterprise/entities/notification';

@Injectable()
export class OnGenerationJobTerminalState {
  constructor(
    @Inject(NotificationsRepository)
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  setupSubscriptions(): void {
    DomainEvents.register(
      (event) =>
        this.handleGenerationJobSucceeded(event as GenerationJobSucceededEvent),
      GenerationJobSucceededEvent.name,
    );
    DomainEvents.register(
      (event) =>
        this.handleGenerationJobFailed(event as GenerationJobFailedEvent),
      GenerationJobFailedEvent.name,
    );
  }

  private async handleGenerationJobSucceeded(
    event: GenerationJobSucceededEvent,
  ): Promise<void> {
    const notification = Notification.create({
      ownerId: event.generationJob.ownerId,
      generationJobId: event.generationJob.id,
      type: NotificationType.GENERATION_SUCCEEDED,
      title: 'Generation completed',
      content: `${event.generationJob.projectName} is ready under the workspace root.`,
    });

    await this.notificationsRepository.create(notification);
  }

  private async handleGenerationJobFailed(
    event: GenerationJobFailedEvent,
  ): Promise<void> {
    const notification = Notification.create({
      ownerId: event.generationJob.ownerId,
      generationJobId: event.generationJob.id,
      type: NotificationType.GENERATION_FAILED,
      title: 'Generation failed',
      content: event.generationJob.failureReason
        ? `${event.generationJob.projectName} failed: ${event.generationJob.failureReason}`
        : `${event.generationJob.projectName} failed.`,
    });

    await this.notificationsRepository.create(notification);
  }
}

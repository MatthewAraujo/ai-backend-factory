import {
  Notification,
  NotificationType,
} from '@/domain/notification/enterprise/entities/notification';

type MakeNotificationOverrides = Partial<{
  content: string;
  createdAt: Date;
  generationJobId: string | null;
  id: string;
  ownerId: string;
  readAt: Date | null;
  title: string;
  type: NotificationType;
  updatedAt: Date;
}>;

export function makeNotification(
  overrides: MakeNotificationOverrides = {},
): Notification {
  return Notification.create(
    {
      ownerId: overrides.ownerId ?? 'owner-1',
      generationJobId: overrides.generationJobId ?? 'job-1',
      type: overrides.type ?? NotificationType.GENERATION_SUCCEEDED,
      title: overrides.title ?? 'Generation completed',
      content: overrides.content ?? 'Factory CRM is ready.',
      readAt: overrides.readAt,
      createdAt: overrides.createdAt,
      updatedAt: overrides.updatedAt,
    },
    overrides.id,
  );
}

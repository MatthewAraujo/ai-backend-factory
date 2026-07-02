import {
  Notification,
  NotificationType,
} from '@/domain/notification/enterprise/entities/notification';

describe('Notification', () => {
  it('starts unread', () => {
    const notification = Notification.create({
      ownerId: 'owner-1',
      generationJobId: 'job-1',
      type: NotificationType.GENERATION_SUCCEEDED,
      title: 'Generation completed',
      content: 'Factory CRM is ready.',
    });

    expect(notification.readAt).toBeNull();
    expect(notification.isRead).toBe(false);
  });

  it('marks a notification as read only once', () => {
    const notification = Notification.create({
      ownerId: 'owner-1',
      generationJobId: 'job-1',
      type: NotificationType.GENERATION_SUCCEEDED,
      title: 'Generation completed',
      content: 'Factory CRM is ready.',
    });

    notification.markAsRead(new Date('2026-07-01T21:10:00.000Z'));
    notification.markAsRead(new Date('2026-07-01T21:12:00.000Z'));

    expect(notification.readAt).toEqual(new Date('2026-07-01T21:10:00.000Z'));
    expect(notification.isRead).toBe(true);
  });
});

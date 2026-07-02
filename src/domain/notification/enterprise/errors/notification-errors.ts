import { DomainError } from '@/core/errors/domain-error';

export class MissingNotificationOwnerError extends DomainError {
  constructor() {
    super('Notification owner is required.');
  }
}

export class MissingNotificationTitleError extends DomainError {
  constructor() {
    super('Notification title is required.');
  }
}

export class MissingNotificationContentError extends DomainError {
  constructor() {
    super('Notification content is required.');
  }
}

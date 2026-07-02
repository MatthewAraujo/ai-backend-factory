import { randomUUID } from 'node:crypto';

export enum NotificationType {
  GENERATION_SUCCEEDED = 'GENERATION_SUCCEEDED',
  GENERATION_FAILED = 'GENERATION_FAILED',
}

type NotificationProps = {
  content: string;
  createdAt?: Date;
  generationJobId?: string | null;
  id?: string;
  ownerId: string;
  readAt?: Date | null;
  title: string;
  type: NotificationType;
  updatedAt?: Date;
};

export class Notification {
  private constructor(private props: Required<NotificationProps>) {}

  static create(props: NotificationProps): Notification {
    const ownerId = props.ownerId.trim();
    const title = props.title.trim();
    const content = props.content.trim();
    const generationJobId = props.generationJobId?.trim() || null;

    if (ownerId.length === 0) {
      throw new Error('Notification owner is required.');
    }

    if (title.length === 0) {
      throw new Error('Notification title is required.');
    }

    if (content.length === 0) {
      throw new Error('Notification content is required.');
    }

    const createdAt = props.createdAt ?? new Date();

    return new Notification({
      id: props.id ?? randomUUID(),
      ownerId,
      generationJobId,
      type: props.type,
      title,
      content,
      readAt: props.readAt ?? null,
      createdAt,
      updatedAt: props.updatedAt ?? createdAt,
    });
  }

  markAsRead(readAt: Date = new Date()): void {
    if (this.props.readAt) {
      return;
    }

    this.props.readAt = readAt;
    this.props.updatedAt = readAt;
  }

  get id(): string {
    return this.props.id;
  }

  get ownerId(): string {
    return this.props.ownerId;
  }

  get generationJobId(): string | null {
    return this.props.generationJobId;
  }

  get type(): NotificationType {
    return this.props.type;
  }

  get title(): string {
    return this.props.title;
  }

  get content(): string {
    return this.props.content;
  }

  get readAt(): Date | null {
    return this.props.readAt;
  }

  get isRead(): boolean {
    return this.props.readAt !== null;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}

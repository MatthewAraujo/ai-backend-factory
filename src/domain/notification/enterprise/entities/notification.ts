import { AggregateRoot } from '@/core/entities/aggregate-root';
import {
  type UniqueEntityID,
  type UniqueEntityIDLike,
  resolveOptionalUniqueEntityID,
  resolveUniqueEntityID,
} from '@/core/entities/unique-entity-id';
import type { Optional } from '@/core/types/optional';
import {
  MissingNotificationContentError,
  MissingNotificationOwnerError,
  MissingNotificationTitleError,
} from '@/domain/notification/enterprise/errors/notification-errors';

export enum NotificationType {
  GENERATION_SUCCEEDED = 'GENERATION_SUCCEEDED',
  GENERATION_FAILED = 'GENERATION_FAILED',
}

type NotificationProps = {
  content: string;
  createdAt: Date;
  generationJobId: UniqueEntityID | null;
  ownerId: UniqueEntityID;
  readAt: Date | null;
  title: string;
  type: NotificationType;
  updatedAt: Date;
};

type CreateNotificationProps = Optional<
  {
    content: string;
    createdAt?: Date;
    generationJobId?: UniqueEntityIDLike | null;
    ownerId: UniqueEntityIDLike;
    readAt?: Date | null;
    title: string;
    type: NotificationType;
    updatedAt?: Date;
  },
  'createdAt' | 'generationJobId' | 'readAt' | 'updatedAt'
>;

export class Notification extends AggregateRoot<NotificationProps> {
  private constructor(props: NotificationProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: CreateNotificationProps,
    id?: UniqueEntityIDLike,
  ): Notification {
    const ownerId = resolveUniqueEntityID(props.ownerId);
    const title = props.title.trim();
    const content = props.content.trim();
    const generationJobId =
      props.generationJobId === null
        ? null
        : resolveOptionalUniqueEntityID(props.generationJobId);

    if (!ownerId) {
      throw new MissingNotificationOwnerError();
    }

    if (title.length === 0) {
      throw new MissingNotificationTitleError();
    }

    if (content.length === 0) {
      throw new MissingNotificationContentError();
    }

    const createdAt = props.createdAt ?? new Date();

    return new Notification(
      {
        ownerId,
        generationJobId,
        type: props.type,
        title,
        content,
        readAt: props.readAt ?? null,
        createdAt,
        updatedAt: props.updatedAt ?? createdAt,
      },
      resolveUniqueEntityID(id),
    );
  }

  markAsRead(readAt: Date = new Date()): void {
    if (this.props.readAt) {
      return;
    }

    this.props.readAt = readAt;
    this.props.updatedAt = readAt;
  }

  get ownerId(): UniqueEntityID {
    return this.props.ownerId;
  }

  get generationJobId(): UniqueEntityID | null {
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

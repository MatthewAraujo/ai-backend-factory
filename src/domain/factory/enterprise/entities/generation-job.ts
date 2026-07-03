import { AggregateRoot } from '@/core/entities/aggregate-root';
import {
  type UniqueEntityID,
  type UniqueEntityIDLike,
  resolveUniqueEntityID,
} from '@/core/entities/unique-entity-id';
import type { Optional } from '@/core/types/optional';
import { GenerationJobFailedEvent } from '@/domain/factory/application/events/generation-job-failed-event';
import { GenerationJobSucceededEvent } from '@/domain/factory/application/events/generation-job-succeeded-event';
import {
  InvalidGenerationJobFailureTransitionError,
  InvalidGenerationJobStartTransitionError,
  InvalidGenerationJobSuccessTransitionError,
  MissingGenerationJobFailureReasonError,
  MissingGenerationJobOutputPathError,
  MissingGenerationJobOwnerError,
  MissingGenerationJobProjectDescriptionError,
  MissingGenerationJobProjectNameError,
} from '@/domain/factory/enterprise/errors/generation-job-errors';

export enum GenerationJobState {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
}

type GenerationJobProps = {
  completedAt: Date | null;
  createdAt: Date;
  failureReason: string | null;
  notes: string;
  outputPath: string | null;
  ownerId: UniqueEntityID;
  projectDescription: string;
  projectName: string;
  startedAt: Date | null;
  state: GenerationJobState;
  updatedAt: Date;
};

type CreateGenerationJobProps = Optional<
  {
    completedAt?: Date | null;
    createdAt?: Date;
    failureReason?: string | null;
    notes: string;
    outputPath?: string | null;
    ownerId: UniqueEntityIDLike;
    projectDescription: string;
    projectName: string;
    startedAt?: Date | null;
    state?: GenerationJobState;
    updatedAt?: Date;
  },
  | 'completedAt'
  | 'createdAt'
  | 'failureReason'
  | 'outputPath'
  | 'startedAt'
  | 'state'
  | 'updatedAt'
>;

export class GenerationJob extends AggregateRoot<GenerationJobProps> {
  private constructor(props: GenerationJobProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(
    props: CreateGenerationJobProps,
    id?: UniqueEntityIDLike,
  ): GenerationJob {
    const projectName = props.projectName.trim();
    const projectDescription = props.projectDescription.trim();
    const notes = props.notes.trim();
    const normalizedOwnerId =
      typeof props.ownerId === 'string' ? props.ownerId.trim() : props.ownerId;

    if (
      normalizedOwnerId === undefined ||
      (typeof normalizedOwnerId === 'string' && normalizedOwnerId.length === 0)
    ) {
      throw new MissingGenerationJobOwnerError();
    }

    const ownerId = resolveUniqueEntityID(normalizedOwnerId);

    if (!ownerId) {
      throw new MissingGenerationJobOwnerError();
    }

    if (projectName.length === 0) {
      throw new MissingGenerationJobProjectNameError();
    }

    if (projectDescription.length === 0) {
      throw new MissingGenerationJobProjectDescriptionError();
    }

    const createdAt = props.createdAt ?? new Date();

    return new GenerationJob(
      {
        ownerId,
        projectName,
        projectDescription,
        notes,
        state: props.state ?? GenerationJobState.PENDING,
        outputPath: props.outputPath ?? null,
        failureReason: props.failureReason ?? null,
        startedAt: props.startedAt ?? null,
        completedAt: props.completedAt ?? null,
        createdAt,
        updatedAt: props.updatedAt ?? createdAt,
      },
      resolveUniqueEntityID(id),
    );
  }

  start(startedAt: Date = new Date()): void {
    if (this.props.state !== GenerationJobState.PENDING) {
      throw new InvalidGenerationJobStartTransitionError();
    }

    this.props.state = GenerationJobState.RUNNING;
    this.props.startedAt = startedAt;
    this.props.updatedAt = startedAt;
  }

  succeed(outputPath: string, completedAt: Date = new Date()): void {
    if (this.props.state !== GenerationJobState.RUNNING) {
      throw new InvalidGenerationJobSuccessTransitionError();
    }

    const normalizedOutputPath = outputPath.trim();

    if (normalizedOutputPath.length === 0) {
      throw new MissingGenerationJobOutputPathError();
    }

    this.props.state = GenerationJobState.SUCCEEDED;
    this.props.outputPath = normalizedOutputPath;
    this.props.failureReason = null;
    this.props.completedAt = completedAt;
    this.props.updatedAt = completedAt;
    this.addDomainEvent(new GenerationJobSucceededEvent(this));
  }

  fail(failureReason: string, completedAt: Date = new Date()): void {
    if (this.props.state !== GenerationJobState.RUNNING) {
      throw new InvalidGenerationJobFailureTransitionError();
    }

    const normalizedFailureReason = failureReason.trim();

    if (normalizedFailureReason.length === 0) {
      throw new MissingGenerationJobFailureReasonError();
    }

    this.props.state = GenerationJobState.FAILED;
    this.props.failureReason = normalizedFailureReason;
    this.props.outputPath = null;
    this.props.completedAt = completedAt;
    this.props.updatedAt = completedAt;
    this.addDomainEvent(new GenerationJobFailedEvent(this));
  }

  get ownerId(): UniqueEntityID {
    return this.props.ownerId;
  }

  get projectName(): string {
    return this.props.projectName;
  }

  get projectDescription(): string {
    return this.props.projectDescription;
  }

  get notes(): string {
    return this.props.notes;
  }

  get state(): GenerationJobState {
    return this.props.state;
  }

  get outputPath(): string | null {
    return this.props.outputPath;
  }

  get failureReason(): string | null {
    return this.props.failureReason;
  }

  get startedAt(): Date | null {
    return this.props.startedAt;
  }

  get completedAt(): Date | null {
    return this.props.completedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
